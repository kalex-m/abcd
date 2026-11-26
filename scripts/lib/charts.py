"""House chart style for investment-hunt reports (CLAUDE.md sections 2.9 and 13).

Rules baked in: no tree metaphors, no biblical labels, no default-template look.
One axis per chart (never dual-axis). Categorical hues in fixed order, never cycled.
Status colours (survived / watch / dropped) are reserved for status and always ship with a text label.

Everything renders to inline SVG strings so reports stay single-file HTML.

    import charts
    charts.apply_style()
    svg = charts.fingerprint_strips(rows)          # rows: [{"ticker":..,"status":..,"scores":[17 ints]}]
    svg = charts.regime_heat_grid(rows, today="slowdown")
"""
import io

# Validated reference palette (light surface). Order is the colour-blind safety mechanism: keep it.
SERIES = ["#257de0", "#f47230", "#00b894", "#f2a600", "#ee7fac", "#008a17", "#6a4ce2", "#ec4647"]
SEQ = ["#cce3fd", "#9dc8f7", "#6aabf1", "#338ced", "#2370cd", "#1757ac", "#0e3d7e"]  # 1..5 score ramp uses 5 of these
DIVERGE = {"neg": "#dc3c3d", "mid": "#efefef", "pos": "#257de0"}
STATUS = {"survived": "#0aac23", "watch": "#fbb315", "dropped": "#dc3c3d"}
INK, INK2, GRID, AXIS, SURFACE, PLANE = "#191919", "#666666", "#e7e7e7", "#c2c2c2", "#ffffff", "#f9f9f9"
FONT = ["Inter", "Segoe UI", "DejaVu Sans", "sans-serif"]
REGIMES = ["boom", "overheat", "stagflation", "slowdown"]
READ_NAMES = ["What they do", "What they sell", "Who buys", "Where", "Money model", "Operations",
              "Supply chain", "Edge", "Everyday brand", "Rivals/share", "Runway", "Cash & leaders",
              "Durability", "Red flags", "Regime fit", "Rules/politics", "Price"]


def apply_style():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({
        "font.family": "sans-serif", "font.sans-serif": FONT, "font.size": 10,
        "text.color": INK, "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
        "axes.edgecolor": AXIS, "axes.linewidth": 0.8, "axes.facecolor": SURFACE, "figure.facecolor": SURFACE,
        "axes.spines.top": False, "axes.spines.right": False,
        "axes.grid": True, "axes.grid.axis": "y", "grid.color": GRID, "grid.linewidth": 0.6,
        "axes.prop_cycle": matplotlib.cycler(color=SERIES), "lines.linewidth": 2.0,
        "legend.frameon": False, "svg.fonttype": "none", "axes.titlelocation": "left",
        "axes.titleweight": "semibold", "axes.titlesize": 12,
    })
    return plt


def to_svg(fig):
    """Inline SVG string (no XML header) and closes the figure."""
    import matplotlib.pyplot as plt
    buf = io.StringIO()
    fig.savefig(buf, format="svg", bbox_inches="tight")
    plt.close(fig)
    s = buf.getvalue()
    return s[s.find("<svg"):]


def status_chip(status, reason=""):
    """HTML chip: colour + text label, never colour alone."""
    label = {"survived": "Survived", "watch": "Watch", "dropped": "Dropped"}.get(status, status)
    fg = "#0b0b0b" if status == "watch" else "#ffffff"
    return (f'<span class="chip chip-{status}" style="background:{STATUS.get(status, AXIS)};color:{fg};'
            f'border-radius:999px;padding:2px 10px;font-weight:600;font-size:12px" title="{reason}">{label}</span>')


def fingerprint_strips(rows, title="Fingerprints: 17 reads, scored 1-5"):
    """Stacked colour strips, one row per company, sequential blue ramp (1 light -> 5 dark), score printed in cell."""
    plt = apply_style()
    from matplotlib.colors import ListedColormap, BoundaryNorm
    cmap = ListedColormap([SEQ[0], SEQ[2], SEQ[3], SEQ[4], SEQ[6]])
    norm = BoundaryNorm([0.5, 1.5, 2.5, 3.5, 4.5, 5.5], cmap.N)
    n = len(rows)
    fig, ax = plt.subplots(figsize=(11, 0.42 * n + 1.6))
    data = [r["scores"] for r in rows]
    ax.imshow(data, cmap=cmap, norm=norm, aspect="auto")
    ax.set_xticks(range(17), READ_NAMES, rotation=40, ha="right", fontsize=8)
    ax.set_yticks(range(n), [f'{r["ticker"]}  ·  {r.get("status", "")}' for r in rows], fontsize=9)
    ax.grid(False)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks([x - 0.5 for x in range(1, 17)], minor=True)
    ax.set_yticks([y - 0.5 for y in range(1, n)], minor=True)
    ax.grid(which="minor", color=SURFACE, linewidth=2)  # 2px surface gap between cells
    ax.tick_params(which="both", length=0)
    for i, r in enumerate(rows):
        for j, v in enumerate(r["scores"]):
            ax.text(j, i, str(v), ha="center", va="center", fontsize=7.5, color=INK if v <= 3 else SURFACE)
    ax.set_title(title)
    return to_svg(fig)


def regime_heat_grid(rows, today=None, title="Regime heat grid"):
    """rows: [{"ticker":..,"grid":{"boom":"+",...}}]. Diverging red/grey/blue, today's column outlined."""
    plt = apply_style()
    val = {"+": 1, "0": 0, "-": -1}
    col = {1: DIVERGE["pos"], 0: DIVERGE["mid"], -1: DIVERGE["neg"]}
    n = len(rows)
    fig, ax = plt.subplots(figsize=(6.4, 0.38 * n + 1.4))
    for i, r in enumerate(rows):
        for j, reg in enumerate(REGIMES):
            v = val.get(r["grid"].get(reg, "0"), 0)
            ax.add_patch(plt.Rectangle((j + 0.04, i + 0.06), 0.92, 0.88, color=col[v], lw=0))
            ax.text(j + 0.5, i + 0.5, {1: "+", 0: "·", -1: "−"}[v], ha="center", va="center",
                    color=SURFACE if v else INK2, fontsize=11, fontweight="bold")
    if today in REGIMES:
        j = REGIMES.index(today)
        ax.add_patch(plt.Rectangle((j, 0), 1, n, fill=False, ec=INK, lw=1.6))
    ax.set_xlim(0, 4); ax.set_ylim(n, 0)
    ax.set_xticks([x + 0.5 for x in range(4)],
                  [r.capitalize() + ("  (now)" if r == today else "") for r in REGIMES])
    ax.xaxis.tick_top()
    ax.set_yticks([y + 0.5 for y in range(n)], [r["ticker"] for r in rows])
    ax.grid(False); ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_title(title, pad=26)
    return to_svg(fig)


def bars(labels, values, title, unit="", highlight=None):
    """Single-measure horizontal bars, sorted, thin, direct value labels on the highlighted bar only."""
    plt = apply_style()
    pairs = sorted(zip(labels, values), key=lambda p: p[1])
    fig, ax = plt.subplots(figsize=(7, 0.34 * len(pairs) + 1.2))
    for i, (l, v) in enumerate(pairs):
        c = SERIES[0] if (highlight is None or l in highlight) else "#b6d5f8"
        ax.barh(i, v, height=0.62, color=c)
        if highlight and l in highlight:
            ax.text(v, i, f" {v:,.1f}{unit}", va="center", fontsize=8.5, color=INK)
    ax.set_yticks(range(len(pairs)), [p[0] for p in pairs])
    ax.grid(axis="x"); ax.grid(axis="y", visible=False)
    ax.axvline(0, color=AXIS, lw=0.8)
    ax.set_title(title)
    return to_svg(fig)
