"""Step 6 valuation helpers (CLAUDE.md 6.6). Plain, transparent math; every input is passed in explicitly.

- reverse_dcf(ev, fcf0, r, g_term, years): constant growth over `years` that justifies `ev`.
- dcf(fcf0, growth_path, r, g_term): present value of a growth path plus a Gordon terminal value.
- residual_income(tbv_ps, roe, coe, g): bank value per share = TBV * (ROE - g) / (COE - g).
- implied_roe(p_tbv, coe, g): the sustained ROE a P/TBV multiple implies.
- epv(owner_earnings, r): earnings power value with zero growth.
"""


def dcf(fcf0, growth_path, r=0.10, g_term=0.03):
    pv, f = 0.0, fcf0
    for i, g in enumerate(growth_path, 1):
        f *= 1 + g
        pv += f / (1 + r) ** i
    tv = f * (1 + g_term) / (r - g_term)
    return pv + tv / (1 + r) ** len(growth_path)


def reverse_dcf(ev, fcf0, r=0.10, g_term=0.03, years=10):
    lo, hi = -0.5, 1.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if dcf(fcf0, [mid] * years, r, g_term) > ev:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def fade(start, end, years=10):
    return [start + (end - start) * i / (years - 1) for i in range(years)]


def residual_income(tbv_ps, roe, coe=0.10, g=0.03):
    return tbv_ps * (roe - g) / (coe - g)


def implied_roe(p_tbv, coe=0.10, g=0.03):
    return p_tbv * (coe - g) + g


def epv(owner_earnings, r=0.10):
    return owner_earnings / r
