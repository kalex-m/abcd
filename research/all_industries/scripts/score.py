"""Within-industry scoring + brute force.
- percentile rank every metric inside its industry (direction-aware; missing = neutral 0.5)
- 9 pillars = user's cycle (Revenue->Margins->FCF->War chest->Capital->Capital intensity->Business model) + Value + Survival
- brute force: N random pillar-weight vectors (Dirichlet) x random metric subsets (70%) x horizon lens (now/5y/10y/all)
- named schemes + leave-one-pillar-out; gates from the depressed-sector tree (FCF & revenue stable? capital to survive?)
Function score_industry() is reused by the point-in-time backtest."""
import numpy as np
from compute import SPEC, PILLARS

SCHEMES = {  # weights over PILLARS order: Revenue, Margins, FCF, WarChest, Capital, CapLight, Business, Value, Survival
 "Equal":          [1, 1, 1, 1, 1, 1, 1, 1, 1],
 "Cycle (img 4)":  [1, 1, 1, 1, 1, 1, 1, .5, .5],
 "Buffett owner":  [.5, 1, 2, 1, 2, 1, 2, 2, 1],
 "Deep value":     [.5, .5, 1, .5, .5, .5, .5, 4, 1],
 "Quality":        [.5, 2, 2, .5, 2, .5, 2, .5, .5],
 "Survival (img 3)": [1, .5, 2, 3, .5, .5, .5, 1, 3],
 "Growth":         [3, 1, 1, .5, 1, .5, .5, .5, .5],
}
HZ = ["all", "now", "5y", "10y"]

def pct_matrix(rows, kind):
    """rows: list of metric dicts (one per company). Returns (metric names, matrix [n_co x n_metric] of percentiles, pillar idx, horizon idx)."""
    spec = SPEC[kind]; names = list(spec)
    n = len(rows); M = np.full((n, len(names)), 0.5)
    for j, k in enumerate(names):
        d = spec[k][1]
        vals = [(i, r.get(k)) for i, r in enumerate(rows) if r.get(k) is not None]
        if len(vals) < 2: continue
        xs = np.array([v for _, v in vals], float) * d
        order = xs.argsort().argsort().astype(float)
        # average ties
        for u in np.unique(xs):
            idx = np.where(xs == u)[0]
            order[idx] = order[idx].mean()
        p = order / (len(xs) - 1)
        for (i, _), q in zip(vals, p): M[i, j] = q
    pil = np.array([PILLARS.index(spec[k][0]) for k in names])
    hz = np.array([HZ.index(spec[k][2]) for k in names])
    return names, M, pil, hz

def pillar_scores(M, pil, mask=None):
    """mask: [n_metric] bool. Returns [n_co x 9] pillar means (0.5 when pillar has no active metric)."""
    n = M.shape[0]; P = np.full((n, len(PILLARS)), 0.5)
    for p in range(len(PILLARS)):
        sel = (pil == p) if mask is None else ((pil == p) & mask)
        if sel.any(): P[:, p] = M[:, sel].mean(1)
    return P

def brute_force(M, pil, hz, n_draw=20000, seed=7, keep=0.7):
    rng = np.random.default_rng(seed)
    n_co, n_m = M.shape; n_p = len(PILLARS)
    W = rng.dirichlet(np.ones(n_p), n_draw)                       # random pillar weights
    H = rng.integers(0, 4, n_draw)                                 # horizon lens
    K = rng.random((n_draw, n_m)) < keep                           # random metric subset
    K &= (H[:, None] == 0) | (hz[None, :] == H[:, None])
    # pillar score per draw: (n_draw x n_co x n_p) via masked means
    memb = np.stack([(pil == p) for p in range(n_p)], 1).astype(float)   # n_m x n_p
    act = K[:, :, None] * memb[None, :, :]                                # draw x m x p
    cnt = act.sum(1)                                                      # draw x p
    num = np.einsum("cm,dmp->dcp", M, act)                                # draw x co x p
    P = np.where(cnt[:, None, :] > 0, num / np.maximum(cnt[:, None, :], 1), 0.5)
    S = np.einsum("dcp,dp->dc", P, W)
    win = np.bincount(S.argmax(1), minlength=n_co) / n_draw
    top3 = np.zeros(n_co)
    for r in np.argsort(-S, 1)[:, :3].T: top3 += np.bincount(r, minlength=n_co)
    avg_rank = (np.argsort(np.argsort(-S, 1), 1) + 1).mean(0)
    return win, top3 / n_draw, avg_rank

def score_industry(rows, kind, n_draw=20000, seed=7):
    names, M, pil, hz = pct_matrix(rows, kind)
    P_all = pillar_scores(M, pil)
    P_h = {h: pillar_scores(M, pil, (hz == HZ.index(h))) for h in HZ[1:]}
    win, top3, avg_rank = brute_force(M, pil, hz, n_draw, seed)
    sch = {}
    for nm, w in SCHEMES.items():
        w = np.array(w, float); s = P_all @ w / w.sum()
        sch[nm] = s
    eq = P_all.mean(1)
    lopo = []  # leave-one-pillar-out winners (equal weights)
    for p in range(len(PILLARS)):
        w = np.ones(len(PILLARS)); w[p] = 0; lopo.append(int((P_all @ w).argmax()))
    return {"metrics": names, "M": M, "P": P_all, "P_h": P_h, "win": win, "top3": top3, "avg_rank": avg_rank,
            "schemes": sch, "equal": eq, "lopo": lopo}

def gates(m, kind, ind, peers=None):
    """Image-3 tree. Returns dict gate->(pass bool, reason). peers: industry medians for relative (share-loss) test."""
    g = {}
    heavy = ind in ("Utilities & Power", "REITs", "Midstream", "Telecom & Cable", "Railroads", "Waste & Environmental Services")
    if kind == "gen":
        fp = m.get("fcf_pos10"); rc = m.get("rev_cagr5"); r10 = m.get("rev_cagr10")
        if heavy:  # regulated / asset-heavy: judge operating cash flow + revenue, FCF negative by design
            ok = (rc is None or rc > -0.02) and (m.get("rev_up_share10") or 0) >= 0.5
            g["stable"] = (ok, f"rev 5y {rc:+.1%}" if rc is not None else "n/a")
        else:
            f5 = m.get("_fcf_pos5")
            fcf_ok = (fp is None or fp >= 0.7 or (f5 is not None and f5 >= 4 and fp >= 0.5)) and (m.get("fcf_m_ttm") or 0) > -0.05
            ok = fcf_ok and ((rc is not None and rc > 0) or (r10 is not None and r10 > 0.02))
            g["stable"] = (ok, f"FCF+ {fp:.0%} of yrs, rev 5y {rc:+.1%}" if fp is not None and rc is not None else "short history")
        nd, ic = m.get("nd_ebitda"), m.get("int_cov")
        lim = 6.5 if heavy else 3.5
        ok = (nd is None or nd <= lim) or (ic is not None and ic >= 6)
        g["survive"] = (ok, f"ND/EBITDA {nd:.1f}x, int cov {ic:.0f}x" if nd is not None and ic is not None else "n/a")
    if peers:  # shrinking while the industry grows = share loss / disruption victim, not a cycle
        ry, py_ = m.get("rev_yoy_ttm"), peers.get("rev_yoy_ttm")
        rc, pc = m.get("rev_cagr5"), peers.get("rev_cagr5")
        lag_now = ry is not None and py_ is not None and ry < -0.03 and py_ > 0.03          # shrinking now while industry grows
        lag_5y = rc is not None and pc is not None and rc < 0 and pc > 0.03 and (ry is None or py_ is None or ry < py_)  # 5y shrink, still lagging
        if lag_now or lag_5y:
            g["share"] = (False, f"rev {ry:+.0%} y/y vs industry {py_:+.0%}" if ry is not None and py_ is not None else "shrinking vs peers")
        else:
            g["share"] = (True, "growing with/above industry" if (ry or 0) >= (py_ or 0) else "in line with industry")
    if kind == "gen": return g
    if kind == "bank":
        ok = (m.get("ni_pos10") or 1) >= 0.8 and (m.get("rev_cagr5") or 0) > 0
        g["stable"] = (ok, f"profitable {m.get('ni_pos10') or 0:.0%} of yrs")
        tce = m.get("tce_ta"); h = m.get("htm_loss_tce") or 0
        ok = (tce is None or tce >= 0.045) and h > -0.40
        g["survive"] = (ok, f"TCE/TA {tce:.1%}, HTM hole {h:.0%} of TCE" if tce is not None else "n/a")
    else:
        ok = (m.get("ocf_pos10") or 1) >= 0.8 and (m.get("rev_cagr5") or 0) > 0
        g["stable"] = (ok, f"OCF+ {m.get('ocf_pos10') or 0:.0%} of yrs")
        de = m.get("debt_eq")
        g["survive"] = (de is None or de <= 0.6, f"debt/equity {de:.2f}" if de is not None else "n/a")
    return g
