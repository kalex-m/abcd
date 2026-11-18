"""Shared loaders: universe, SEC records, yfinance market data, FX."""
import json, os, re
import pandas as pd, numpy as np
R = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
U = json.load(open(f"{R}/universe.json"))
IND2SEC = {i: s for s, inds in U.items() for i in inds}
TK2IND = {t: i for s, inds in U.items() for i, ts in inds.items() for t in ts}
INFO = json.load(open(f"{R}/yf/info.json"))
FST = json.load(open(f"{R}/yf/foreign_stmts.json")) if os.path.exists(f"{R}/yf/foreign_stmts.json") else {}
def _csv(name):
    df = pd.read_csv(f"{R}/yf/{name}", index_col=0, parse_dates=True)
    return df.apply(pd.to_numeric, errors="coerce")
MTR = _csv("monthly_tr.csv")            # total-return (dividend+split adjusted) monthly closes
MSA = _csv("monthly_close_splitadj.csv")  # split-adjusted, NOT dividend-adjusted
DTR = _csv("daily_tr_3y.csv")
def sec(t):
    p = f"{R}/sec/{t}.json"
    return json.load(open(p)) if os.path.exists(p) else None
# FX: USD per 1 unit of currency
_FXT = {"EUR": ("EURUSD=X", False), "GBP": ("GBPUSD=X", False), "DKK": ("DKK=X", True), "TWD": ("TWD=X", True), "JPY": ("JPY=X", True),
        "CHF": ("CHF=X", True), "INR": ("INR=X", True), "CAD": ("CAD=X", True), "AUD": ("AUD=X", True), "SEK": ("SEK=X", True), "BRL": ("BRL=X", True)}
def fx(cur, at=None):
    if cur in (None, "USD", "shares"): return 1.0
    sym, inv = _FXT[cur]
    s = MTR[sym].dropna()
    if at is not None: s = s[s.index <= pd.Timestamp(at)]
    v = float(s.iloc[-1]); return 1 / v if inv else v
# ordinary-share splits invisible in ADR price history (ADR ratio changed instead)
EXTRA_SPLITS = {"TM": [("2021-09-29", 5.0)]}
def splits(t): return [tuple(x) for x in INFO.get(t, {}).get("splits", [])] + EXTRA_SPLITS.get(t, [])
def mcap(t): return INFO.get(t, {}).get("marketCap")
_SUFFIX = re.compile(r"(,?\s+(INC\.?|INCORPORATED|CORP\.?|CORPORATION|CO\.?|COMPANY|LTD\.?|LIMITED|PLC|N\.V\.|NV|S\.A\.|SE|AG|A/S|L\.P\.|LP|HOLDINGS?|GROUP|/DE/|/MD/|/NEW/|/NJ/|THE)\b\.?)+\s*$", re.I)
NAME_FIX = {"GOOGL": "Alphabet", "META": "Meta Platforms", "BRK-B": "Berkshire Hathaway", "TSM": "TSMC", "JPM": "JPMorgan Chase", "BAC": "Bank of America",
            "C": "Citigroup", "GS": "Goldman Sachs", "MS": "Morgan Stanley", "XOM": "ExxonMobil", "CVX": "Chevron", "COP": "ConocoPhillips", "BP": "BP",
            "SHEL": "Shell", "TTE": "TotalEnergies", "NVO": "Novo Nordisk", "AZN": "AstraZeneca", "NVS": "Novartis", "TM": "Toyota", "STLA": "Stellantis",
            "BHP": "BHP", "RIO": "Rio Tinto", "BTI": "British American Tobacco", "INFY": "Infosys", "SAP": "SAP", "ASML": "ASML", "SPOT": "Spotify",
            "CP": "Canadian Pacific Kansas City", "PM": "Philip Morris Intl", "MO": "Altria", "KO": "Coca-Cola", "PEP": "PepsiCo", "PG": "Procter & Gamble",
            "JNJ": "Johnson & Johnson", "LLY": "Eli Lilly", "BMY": "Bristol-Myers Squibb", "MRK": "Merck", "UNH": "UnitedHealth", "ELV": "Elevance Health",
            "CI": "Cigna", "HD": "Home Depot", "LOW": "Lowe's", "TJX": "TJX", "MCD": "McDonald's", "CMG": "Chipotle", "DPZ": "Domino's", "QSR": "Restaurant Brands",
            "ORLY": "O'Reilly Automotive", "AZO": "AutoZone", "BKNG": "Booking Holdings", "HLT": "Hilton", "MAR": "Marriott", "RCL": "Royal Caribbean",
            "CCL": "Carnival", "NCLH": "Norwegian Cruise Line", "GE": "GE Aerospace", "GEV": "GE Vernova", "RTX": "RTX", "LMT": "Lockheed Martin",
            "NOC": "Northrop Grumman", "GD": "General Dynamics", "HWM": "Howmet Aerospace", "TDG": "TransDigm", "LHX": "L3Harris", "CAT": "Caterpillar",
            "DE": "Deere", "UPS": "UPS", "FDX": "FedEx", "ODFL": "Old Dominion Freight", "JBHT": "J.B. Hunt", "CHRW": "C.H. Robinson", "DAL": "Delta Air Lines",
            "UAL": "United Airlines", "AAL": "American Airlines", "LUV": "Southwest Airlines", "ALK": "Alaska Air", "JBLU": "JetBlue", "WM": "Waste Management",
            "RSG": "Republic Services", "WCN": "Waste Connections", "EOG": "EOG Resources", "OXY": "Occidental", "DVN": "Devon Energy", "FANG": "Diamondback",
            "KMI": "Kinder Morgan", "WMB": "Williams", "OKE": "ONEOK", "ET": "Energy Transfer", "EPD": "Enterprise Products", "TRGP": "Targa Resources",
            "SLB": "SLB", "HAL": "Halliburton", "BKR": "Baker Hughes", "MPC": "Marathon Petroleum", "VLO": "Valero", "PSX": "Phillips 66", "DINO": "HF Sinclair",
            "LIN": "Linde", "APD": "Air Products", "SHW": "Sherwin-Williams", "ECL": "Ecolab", "DOW": "Dow", "LYB": "LyondellBasell", "DD": "DuPont",
            "FCX": "Freeport-McMoRan", "NEM": "Newmont", "SCCO": "Southern Copper", "NUE": "Nucor", "STLD": "Steel Dynamics", "AA": "Alcoa", "CLF": "Cleveland-Cliffs",
            "NEE": "NextEra Energy", "SO": "Southern Co", "DUK": "Duke Energy", "CEG": "Constellation Energy", "VST": "Vistra", "AEP": "American Electric Power",
            "SRE": "Sempra", "D": "Dominion Energy", "EXC": "Exelon", "NRG": "NRG Energy", "PLD": "Prologis", "AMT": "American Tower", "EQIX": "Equinix",
            "WELL": "Welltower", "SPG": "Simon Property", "O": "Realty Income", "PSA": "Public Storage", "DLR": "Digital Realty", "CCI": "Crown Castle",
            "VICI": "VICI Properties", "V": "Visa", "MA": "Mastercard", "PYPL": "PayPal", "FISV": "Fiserv", "FIS": "FIS", "XYZ": "Block", "GPN": "Global Payments",
            "AXP": "American Express", "COF": "Capital One", "SYF": "Synchrony", "ALLY": "Ally Financial", "PGR": "Progressive", "CB": "Chubb", "TRV": "Travelers",
            "ALL": "Allstate", "AIG": "AIG", "HIG": "Hartford", "WRB": "W. R. Berkley", "CINF": "Cincinnati Financial", "MRSH": "Marsh McLennan", "AON": "Aon",
            "AJG": "Arthur J. Gallagher", "WTW": "Willis Towers Watson", "BRO": "Brown & Brown", "BLK": "BlackRock", "BX": "Blackstone", "KKR": "KKR",
            "APO": "Apollo", "ARES": "Ares Management", "TROW": "T. Rowe Price", "OWL": "Blue Owl", "SPGI": "S&P Global", "MCO": "Moody's", "ICE": "ICE",
            "CME": "CME Group", "NDAQ": "Nasdaq", "MSCI": "MSCI", "CBOE": "Cboe", "SCHW": "Charles Schwab", "IBKR": "Interactive Brokers", "RJF": "Raymond James",
            "HOOD": "Robinhood", "USB": "U.S. Bancorp", "PNC": "PNC", "TFC": "Truist", "MTB": "M&T Bank", "WFC": "Wells Fargo", "NVDA": "NVIDIA", "AVGO": "Broadcom",
            "AMD": "AMD", "QCOM": "Qualcomm", "TXN": "Texas Instruments", "MU": "Micron", "ADI": "Analog Devices", "MRVL": "Marvell", "INTC": "Intel",
            "AMAT": "Applied Materials", "LRCX": "Lam Research", "KLAC": "KLA", "TER": "Teradyne", "ADBE": "Adobe", "CRM": "Salesforce", "NOW": "ServiceNow",
            "INTU": "Intuit", "WDAY": "Workday", "ADSK": "Autodesk", "PLTR": "Palantir", "SNPS": "Synopsys", "CDNS": "Cadence", "PANW": "Palo Alto Networks",
            "CRWD": "CrowdStrike", "FTNT": "Fortinet", "ZS": "Zscaler", "NET": "Cloudflare", "OKTA": "Okta", "AAPL": "Apple", "CSCO": "Cisco", "ANET": "Arista",
            "DELL": "Dell", "HPQ": "HP Inc", "HPE": "HP Enterprise", "SMCI": "Super Micro", "NTAP": "NetApp", "ACN": "Accenture", "IBM": "IBM", "CTSH": "Cognizant",
            "IT": "Gartner", "EPAM": "EPAM", "MSFT": "Microsoft", "AMZN": "Amazon", "ORCL": "Oracle", "TMUS": "T-Mobile US", "VZ": "Verizon", "T": "AT&T",
            "CMCSA": "Comcast", "CHTR": "Charter", "NFLX": "Netflix", "DIS": "Disney", "ROKU": "Roku", "PARA": "Paramount Skydance", "TSLA": "Tesla",
            "GM": "General Motors", "F": "Ford", "RIVN": "Rivian", "DHI": "D.R. Horton", "LEN": "Lennar", "PHM": "PulteGroup", "NVR": "NVR", "TOL": "Toll Brothers",
            "KBH": "KB Home", "SBUX": "Starbucks", "YUM": "Yum! Brands", "DRI": "Darden", "WING": "Wingstop", "ROST": "Ross Stores", "TSCO": "Tractor Supply",
            "ULTA": "Ulta Beauty", "BBY": "Best Buy", "ABNB": "Airbnb", "EXPE": "Expedia", "NKE": "Nike", "LULU": "Lululemon", "DECK": "Deckers", "TPR": "Tapestry",
            "RL": "Ralph Lauren", "CROX": "Crocs", "VFC": "VF Corp", "MELI": "MercadoLibre", "UBER": "Uber", "DASH": "DoorDash", "EBAY": "eBay", "CPNG": "Coupang",
            "ETSY": "Etsy", "MNST": "Monster Beverage", "KDP": "Keurig Dr Pepper", "CELH": "Celsius", "STZ": "Constellation Brands", "BF-B": "Brown-Forman",
            "TAP": "Molson Coors", "CL": "Colgate-Palmolive", "KMB": "Kimberly-Clark", "CHD": "Church & Dwight", "CLX": "Clorox", "EL": "Estee Lauder",
            "MDLZ": "Mondelez", "GIS": "General Mills", "KHC": "Kraft Heinz", "HSY": "Hershey", "CPB": "Campbell's", "CAG": "Conagra", "SJM": "J.M. Smucker",
            "HRL": "Hormel", "MKC": "McCormick", "WMT": "Walmart", "COST": "Costco", "TGT": "Target", "KR": "Kroger", "DG": "Dollar General", "DLTR": "Dollar Tree",
            "BJ": "BJ's Wholesale", "ABBV": "AbbVie", "PFE": "Pfizer", "AMGN": "Amgen", "GILD": "Gilead", "VRTX": "Vertex", "REGN": "Regeneron", "BIIB": "Biogen",
            "ALNY": "Alnylam", "MRNA": "Moderna", "INCY": "Incyte", "CVS": "CVS Health", "HUM": "Humana", "CNC": "Centene", "MOH": "Molina", "ABT": "Abbott",
            "SYK": "Stryker", "BSX": "Boston Scientific", "MDT": "Medtronic", "ISRG": "Intuitive Surgical", "EW": "Edwards Lifesciences", "BDX": "Becton Dickinson",
            "ZBH": "Zimmer Biomet", "TMO": "Thermo Fisher", "DHR": "Danaher", "A": "Agilent", "IQV": "IQVIA", "WAT": "Waters", "MTD": "Mettler-Toledo",
            "IDXX": "IDEXX", "PCAR": "PACCAR", "CMI": "Cummins", "ITW": "Illinois Tool Works", "PH": "Parker-Hannifin", "URI": "United Rentals", "ETN": "Eaton",
            "EMR": "Emerson", "VRT": "Vertiv", "ROK": "Rockwell Automation", "HUBB": "Hubbell", "AME": "AMETEK", "UNP": "Union Pacific", "CSX": "CSX",
            "NSC": "Norfolk Southern", "XPO": "XPO", "SAIA": "Saia", "CLH": "Clean Harbors", "EQT": "EQT", "APA": "APA", "MPLX": "MPLX", "NOV": "NOV", "PBF": "PBF Energy",
            "PPG": "PPG", "CE": "Celanese", "BA": "Boeing"}
def name(t, rec=None):
    if t in NAME_FIX: return NAME_FIX[t]
    n = (rec or {}).get("name") or t
    n = _SUFFIX.sub("", n).strip(" ,.")
    return n.title() if n.isupper() else n
