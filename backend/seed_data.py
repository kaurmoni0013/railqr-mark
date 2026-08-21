import sys
import os
import random
import math
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, RailwayZone, Division, Route, Vendor, FittingType,
    TrackFitting, QRCode, Inspection, MaintenanceTicket,
    MaintenanceHistory, Alert, AIInsight, AuditLog
)

random.seed(42)

ZONES_DATA = [
    {"name": "Northern Railway", "code": "NR", "region": "North"},
    {"name": "Central Railway", "code": "CR", "region": "West"},
    {"name": "Western Railway", "code": "WR", "region": "West"},
    {"name": "Southern Railway", "code": "SR", "region": "South"},
    {"name": "Eastern Railway", "code": "ER", "region": "East"},
]

DIVISIONS_DATA = {
    "NR": [
        {"name": "Delhi Division", "code": "NDLS"},
        {"name": "Lucknow Division", "code": "LKO"},
        {"name": "Firozpur Division", "code": "FZR"},
        {"name": "Ambala Division", "code": "UMB"},
    ],
    "CR": [
        {"name": "Mumbai CST Division", "code": "CSMT"},
        {"name": "Pune Division", "code": "PUNE"},
        {"name": "Nagpur Division", "code": "NGP"},
        {"name": "Bhusawal Division", "code": "BSL"},
    ],
    "WR": [
        {"name": "Mumbai Central Division", "code": "MMCT"},
        {"name": "Ahmedabad Division", "code": "ADI"},
        {"name": "Rajkot Division", "code": "RAJT"},
        {"name": "Vadodara Division", "code": "BRC"},
    ],
    "SR": [
        {"name": "Chennai Division", "code": "MAS"},
        {"name": "Madurai Division", "code": "MDU"},
        {"name": "Trichy Division", "code": "TPJ"},
        {"name": "Coimbatore Division", "code": "CBE"},
    ],
    "ER": [
        {"name": "Howrah Division", "code": "HWH"},
        {"name": "Sealdah Division", "code": "SDAH"},
        {"name": "Malda Town Division", "code": "MLDT"},
        {"name": "Asansol Division", "code": "ASN"},
    ],
}

ROUTES_DATA = [
    {"name": "Delhi-Mumbai Rajdhani Route", "code": "RTE-001", "zone": "NR", "division": "NDLS", "start": "New Delhi", "end": "Mumbai CST", "dist": 1384, "lat": 28.6139, "lng": 77.2090},
    {"name": "Delhi-Kolkata Route", "code": "RTE-002", "zone": "NR", "division": "NDLS", "start": "New Delhi", "end": "Howrah Junction", "dist": 1447, "lat": 28.6139, "lng": 77.2090},
    {"name": "Mumbai-Chennai Route", "code": "RTE-003", "zone": "CR", "division": "CSMT", "start": "Mumbai CST", "end": "Chennai Central", "dist": 1281, "lat": 19.0760, "lng": 72.8777},
    {"name": "Chennai-Bangalore Route", "code": "RTE-004", "zone": "SR", "division": "MAS", "start": "Chennai Central", "end": "KSR Bengaluru", "dist": 346, "lat": 13.0827, "lng": 80.2707},
    {"name": "Howrah-Patna Route", "code": "RTE-005", "zone": "ER", "division": "HWH", "start": "Howrah Junction", "end": "Patna Junction", "dist": 536, "lat": 22.5726, "lng": 88.3639},
    {"name": "Ahmedabad-Jaipur Route", "code": "RTE-006", "zone": "WR", "division": "ADI", "start": "Ahmedabad Junction", "end": "Jaipur Junction", "dist": 670, "lat": 23.0225, "lng": 72.5714},
    {"name": "Delhi-Lucknow Route", "code": "RTE-007", "zone": "NR", "division": "LKO", "start": "New Delhi", "end": "Lucknow NR", "dist": 556, "lat": 28.6139, "lng": 77.2090},
    {"name": "Mumbai-Pune Route", "code": "RTE-008", "zone": "CR", "division": "PUNE", "start": "Mumbai CST", "end": "Pune Junction", "dist": 192, "lat": 19.0760, "lng": 72.8777},
    {"name": "Chennai-Madurai Route", "code": "RTE-009", "zone": "SR", "division": "MAS", "start": "Chennai Central", "end": "Madurai Junction", "dist": 495, "lat": 13.0827, "lng": 80.2707},
    {"name": "Kolkata-Visakhapatnam Route", "code": "RTE-010", "zone": "ER", "division": "HWH", "start": "Howrah Junction", "end": "Visakhapatnam", "dist": 772, "lat": 22.5726, "lng": 88.3639},
    {"name": "Delhi-Chandigarh Route", "code": "RTE-011", "zone": "NR", "division": "UMB", "start": "New Delhi", "end": "Chandigarh Junction", "dist": 243, "lat": 28.6139, "lng": 77.2090},
    {"name": "Mumbai-Ahmedabad Route", "code": "RTE-012", "zone": "WR", "division": "MMCT", "start": "Mumbai Central", "end": "Ahmedabad Junction", "dist": 493, "lat": 19.0760, "lng": 72.8777},
    {"name": "Nagpur-Itarsi Route", "code": "RTE-013", "zone": "CR", "division": "NGP", "start": "Nagpur Junction", "end": "Itarsi Junction", "dist": 302, "lat": 21.1458, "lng": 79.0882},
    {"name": "Kochi-Trivandrum Route", "code": "RTE-014", "zone": "SR", "division": "CBE", "start": "Ernakulam Junction", "end": "Thiruvananthapuram Central", "dist": 306, "lat": 9.9312, "lng": 76.2673},
    {"name": "Asansol-Malda Route", "code": "RTE-015", "zone": "ER", "division": "ASN", "start": "Asansol Junction", "end": "Malda Town", "dist": 251, "lat": 23.6739, "lng": 86.9524},
]

VENDORS_DATA = [
    {"name": "Vossloh Fastening Systems", "code": "VND-001", "email": "sales@vossloh.com", "phone": "+49-234-555-0101", "rating": 4.7},
    {"name": "Pandrol International", "code": "VND-002", "email": "info@pandrol.com", "phone": "+44-1onal-555-0102", "rating": 4.8},
    {"name": "Hardesty & Hanover", "code": "VND-003", "email": "contact@hardesty.com", "phone": "+1-212-555-0103", "rating": 4.3},
    {"name": "Bhalf Industries", "code": "VND-004", "email": "sales@bhalf.com", "phone": "+91-11-555-0104", "rating": 4.1},
    {"name": "Indian Railway Track Solutions", "code": "VND-005", "email": "info@irts.in", "phone": "+91-22-555-0105", "rating": 4.5},
    {"name": "Lpz Rail Components", "code": "VND-006", "email": "export@lpz-rail.de", "phone": "+49-351-555-0106", "rating": 4.6},
    {"name": "Magna International Rail", "code": "VND-007", "email": "rail@magna.com", "phone": "+1-905-555-0107", "rating": 4.2},
    {"name": "Steel Authority of India Rail Division", "code": "VND-008", "email": "rail@sail.in", "phone": "+91-11-555-0108", "rating": 4.0},
    {"name": "Bombardier Transportation India", "code": "VND-009", "email": "india@bombardier.com", "phone": "+91-80-555-0109", "rating": 4.4},
    {"name": "Alstom India Rail", "code": "VND-010", "email": "rail@alstom.in", "phone": "+91-22-555-0110", "rating": 4.5},
    {"name": "Titagarh Rail Systems", "code": "VND-011", "email": "sales@titagarh.in", "phone": "+91-33-555-0111", "rating": 3.9},
    {"name": "Jindal Rail Infrastructure", "code": "VND-012", "email": "rail@jindal.com", "phone": "+91-11-555-0112", "rating": 4.1},
    {"name": "Bharat Forge Rail Division", "code": "VND-013", "email": "rail@bharatforge.com", "phone": "+91-20-555-0113", "rating": 4.3},
    {"name": "Larsen & Toubro Rail Systems", "code": "VND-014", "email": "rail@larsentoubro.com", "phone": "+91-22-555-0114", "rating": 4.6},
    {"name": "Texmaco Rail Engineering", "code": "VND-015", "email": "info@texmaco.in", "phone": "+91-33-555-0115", "rating": 3.8},
    {"name": "Jupiter Group Rail Products", "code": "VND-016", "email": "sales@jupiterrail.com", "phone": "+91-120-555-0116", "rating": 4.0},
    {"name": "Damodar Valley Corporation Rail", "code": "VND-017", "email": "rail@dvc.in", "phone": "+91-322-555-0117", "rating": 3.7},
]

FITTING_TYPES_DATA = [
    {"name": "Elastic Rail Clip", "code": "ERC-001", "category": "Fastening", "life": 15, "desc": "Pandrol-type elastic rail clips for securing rails to sleepers"},
    {"name": "Fish Plate", "code": "FPL-001", "category": "Joint", "life": 12, "desc": "Joint bars connecting two rail sections together"},
    {"name": "Pandrol Clip", "code": "PCL-001", "category": "Fastening", "life": 15, "desc": "Type 300/340 pandrol clips for rail fastening"},
    {"name": "Rail Pad", "code": "RPD-001", "category": "Insulation", "life": 8, "desc": "Elastic pads between rail and sleeper for damping"},
    {"name": "Shoulder Assembly", "code": "SHD-001", "category": "Fastening", "life": 20, "desc": "Cast iron shoulder for concrete sleeper rail fixation"},
    {"name": "Anchor", "code": "ANC-001", "category": "Fastening", "life": 18, "desc": "Rail anchors preventing longitudinal rail movement"},
    {"name": "Turnout Component", "code": "TRN-001", "category": "Switch", "life": 25, "desc": "Components for railway turnout and switching systems"},
    {"name": "Tie Plate", "code": "TPL-001", "category": "Base", "life": 20, "desc": "Base plates for distributing rail loads on sleepers"},
    {"name": "Bolt & Nut Assembly", "code": "BNA-001", "category": "Fastening", "life": 10, "desc": "High-strength bolts and nuts for rail joint connections"},
    {"name": "Rail Lubricator", "code": "RLB-001", "category": "Maintenance", "life": 5, "desc": "Automatic rail lubricators for curve wear reduction"},
    {"name": "Insulated Rail Joint", "code": "IRJ-001", "category": "Joint", "life": 10, "desc": "Electronically insulated rail joints for signal circuits"},
    {"name": "Check Rail", "code": "CKR-001", "category": "Guidance", "life": 20, "desc": "Guard rails for wheel guidance through curves and turnouts"},
]

LOCATIONS = [
    "Near Main Junction", "Bridge Section A", "Curve km 45", "Tunnel Entrance South",
    "Platform Approach", "Yard Section B", "Level Crossing 12", "Embankment km 78",
    "Station Approach", "Double Track Section", "Gradient Section", "River Bridge",
    "Interlocking Zone", "Siding Connection", "Crossover Section", "Signal Post 45",
    "Viaduct Section", "Cutting km 120", "Loop Line Junction", "Maintenance Depot",
]

DAMAGE_TYPES = [
    "Surface Wear", "Corrosion Pitting", "Crack Formation", "Bolt Loosening",
    "Pad Deterioration", "Clip Fatigue", "Plate Warping", "Joint Gap Excessive",
    "Electrical Short", "Impact Damage", "Thermal Expansion Damage", None, None, None,
]

VISUAL_CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]

USER_ACCOUNTS = [
    {"email": "admin@railsaathi.in", "name": "System Administrator", "role": "ADMIN", "pwd": "Admin@123"},
    {"email": "officer.nr@railsaathi.in", "name": "Rajesh Kumar Singh", "role": "RAILWAY_OFFICER", "pwd": "Officer@123"},
    {"email": "officer.cr@railsaathi.in", "name": "Amit Patil", "role": "RAILWAY_OFFICER", "pwd": "Officer@123"},
    {"email": "officer.wr@railsaathi.in", "name": "Priya Mehta", "role": "RAILWAY_OFFICER", "pwd": "Officer@123"},
    {"email": "officer.sr@railsaathi.in", "name": "Karthik Rajan", "role": "RAILWAY_OFFICER", "pwd": "Officer@123"},
    {"email": "officer.er@railsaathi.in", "name": "Suman Das", "role": "RAILWAY_OFFICER", "pwd": "Officer@123"},
    {"email": "inspector1@railsaathi.in", "name": "Vikram Sharma", "role": "INSPECTOR", "pwd": "Inspector@123"},
    {"email": "inspector2@railsaathi.in", "name": "Anjali Verma", "role": "INSPECTOR", "pwd": "Inspector@123"},
    {"email": "inspector3@railsaathi.in", "name": "Suresh Reddy", "role": "INSPECTOR", "pwd": "Inspector@123"},
    {"email": "inspector4@railsaathi.in", "name": "Meena Kumari", "role": "INSPECTOR", "pwd": "Inspector@123"},
    {"email": "inspector5@railsaathi.in", "name": "Prakash Nair", "role": "INSPECTOR", "pwd": "Inspector@123"},
    {"email": "maint1@railsaathi.in", "name": "Arjun Gupta", "role": "MAINTENANCE_ENGINEER", "pwd": "Maint@123"},
    {"email": "maint2@railsaathi.in", "name": "Deepak Joshi", "role": "MAINTENANCE_ENGINEER", "pwd": "Maint@123"},
    {"email": "maint3@railsaathi.in", "name": "Sanjay Kulkarni", "role": "MAINTENANCE_ENGINEER", "pwd": "Maint@123"},
    {"email": "viewer1@railsaathi.in", "name": "Neha Agarwal", "role": "VIEWER", "pwd": "Viewer@123"},
    {"email": "viewer2@railsaathi.in", "name": "Ravi Shankar", "role": "VIEWER", "pwd": "Viewer@123"},
]


def seed():
    print("=" * 60)
    print("  RAILSAATHI - DEMO DATA SEEDER")
    print("=" * 60)

    print("\n[1/10] Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing = db.query(User).count()
    if existing > 0:
        print(f"  Database already has {existing} users. Re-seeding (clearing existing data)...")
        db.query(AuditLog).delete()
        db.query(AIInsight).delete()
        db.query(Alert).delete()
        db.query(MaintenanceHistory).delete()
        db.query(MaintenanceTicket).delete()
        db.query(Inspection).delete()
        db.query(QRCode).delete()
        db.query(TrackFitting).delete()
        db.query(Route).delete()
        db.query(Division).delete()
        db.query(Vendor).delete()
        db.query(FittingType).delete()
        db.query(RailwayZone).delete()
        db.query(User).delete()
        db.commit()
        print("  Cleared existing data.")

    print("\n[2/10] Creating railway zones...")
    zones = {}
    for zd in ZONES_DATA:
        z = RailwayZone(name=zd["name"], code=zd["code"], region=zd["region"])
        db.add(z)
        db.flush()
        zones[zd["code"]] = z
        print(f"    + Zone: {zd['name']} ({zd['code']})")

    print("\n[3/10] Creating divisions...")
    divisions = {}
    for zone_code, divs in DIVISIONS_DATA.items():
        for dd in divs:
            d = Division(name=dd["name"], code=dd["code"], zone_id=zones[zone_code].id)
            db.add(d)
            db.flush()
            divisions[dd["code"]] = d
            print(f"    + Division: {dd['name']} ({dd['code']})")

    print("\n[4/10] Creating routes...")
    routes = []
    for rd in ROUTES_DATA:
        r = Route(
            name=rd["name"], code=rd["code"],
            zone_id=zones[rd["zone"]].id,
            division_id=divisions[rd["division"]].id,
            start_location=rd["start"], end_location=rd["end"],
            distance_km=rd["dist"],
        )
        db.add(r)
        db.flush()
        routes.append({"route": r, "base_lat": rd["lat"], "base_lng": rd["lng"]})
        print(f"    + Route: {rd['name']}")

    print("\n[5/10] Creating vendors...")
    vendors = []
    for vd in VENDORS_DATA:
        v = Vendor(
            name=vd["name"], code=vd["code"],
            contact_email=vd["email"], contact_phone=vd["phone"],
            rating=vd["rating"], is_active=True,
        )
        db.add(v)
        db.flush()
        vendors.append(v)
        print(f"    + Vendor: {vd['name']}")

    print("\n[6/10] Creating fitting types...")
    fitting_types = []
    for ftd in FITTING_TYPES_DATA:
        ft = FittingType(
            name=ftd["name"], code=ftd["code"],
            category=ftd["category"], expected_life_years=ftd["life"],
            description=ftd["desc"],
        )
        db.add(ft)
        db.flush()
        fitting_types.append(ft)
        print(f"    + Type: {ftd['name']}")

    print("\n[7/10] Creating user accounts...")
    users = []
    for ud in USER_ACCOUNTS:
        zone_obj = random.choice(list(zones.values()))
        u = User(
            email=ud["email"], full_name=ud["name"],
            hashed_password=get_password_hash(ud["pwd"]),
            role=ud["role"], zone_id=zone_obj.id, is_active=True,
        )
        db.add(u)
        db.flush()
        users.append(u)
        print(f"    + User: {ud['name']} ({ud['role']})")

    db.commit()

    print("\n[8/10] Creating 50,000 track fittings...")
    now = datetime.utcnow()
    all_fittings = []
    for i in range(50000):
        route_info = routes[i % len(routes)]
        route = route_info["route"]
        zone = db.query(RailwayZone).filter(RailwayZone.id == route.zone_id).first()
        div = db.query(Division).filter(Division.id == route.division_id).first()

        ft = fitting_types[i % len(fitting_types)]
        vendor = vendors[i % len(vendors)]

        years_ago = random.uniform(0.5, 20)
        inst_date = now - timedelta(days=years_ago * 365.25)
        man_date = inst_date - timedelta(days=random.randint(30, 365))

        age_factor = years_ago / ft.expected_life_years
        base_health = 100 - (age_factor * 40)
        health = max(5, min(100, base_health + random.uniform(-15, 10)))
        health = round(health, 1)

        if health >= 80:
            status = "HEALTHY"
        elif health >= 55:
            status = "ATTENTION"
        elif health >= 30:
            status = "CRITICAL"
        else:
            status = random.choice(["CRITICAL", "UNDER_MAINTENANCE"])

        if random.random() < 0.02:
            status = "UNDER_MAINTENANCE"
        if random.random() < 0.01:
            status = "RETIRED"

        lat_offset = random.uniform(-0.5, 0.5)
        lng_offset = random.uniform(-0.5, 0.5)
        lat = route_info["base_lat"] + lat_offset
        lng = route_info["base_lng"] + lng_offset

        days_since_insp = random.randint(0, 300)
        last_insp = now - timedelta(days=days_since_insp)
        next_insp = last_insp + timedelta(days=random.choice([30, 60, 90, 180]))

        fitting_code = f"TF-{zone.code}-{ft.code[-3:]}-{i+1:06d}"
        loc = LOCATIONS[i % len(LOCATIONS)]

        f = TrackFitting(
            fitting_code=fitting_code,
            fitting_type_id=ft.id,
            vendor_id=vendor.id,
            batch_number=f"BATCH-{random.randint(1000, 9999)}-{inst_date.year}",
            manufacturing_date=man_date,
            installation_date=inst_date,
            zone_id=zone.id,
            division_id=div.id,
            route_id=route.id,
            latitude=round(lat, 6),
            longitude=round(lng, 6),
            location_name=loc,
            status=status,
            health_score=health,
            service_life_years=ft.expected_life_years + random.randint(-3, 5),
            last_inspection_date=last_insp,
            next_inspection_date=next_insp,
        )
        db.add(f)
        all_fittings.append(f)

        if (i + 1) % 10000 == 0:
            db.flush()
            print(f"    ... {i+1:,} fittings created")

    db.flush()
    print(f"    Total: 50,000 fittings created")

    print("\n[9/10] Creating inspections, tickets, alerts, insights...")

    print("    Creating 25,000 inspections...")
    inspector_users = [u for u in users if u.role == "INSPECTOR"]
    for i in range(25000):
        fitting = all_fittings[i % len(all_fittings)]
        inspector = inspector_users[i % len(inspector_users)]

        days_ago = random.randint(1, 800)
        created = now - timedelta(days=days_ago)

        if random.random() < 0.7:
            status = "COMPLETED"
            comp_date = created + timedelta(days=random.randint(0, 3))
        elif random.random() < 0.5:
            status = "SCHEDULED"
            comp_date = None
        else:
            status = "OVERDUE"
            comp_date = None

        wear = random.randint(1, 10)
        corr = random.randint(1, 10)
        vc = random.choice(VISUAL_CONDITIONS)
        dmg = random.choice(DAMAGE_TYPES)

        age = (now - fitting.installation_date).days / 365.25 if fitting.installation_date else 5
        expected_life = 15
        for ft_obj in fitting_types:
            if ft_obj.id == fitting.fitting_type_id:
                expected_life = ft_obj.expected_life_years
                break
        from app.ml.risk_model import calculate_health_score
        hs = calculate_health_score(wear, corr, age / max(expected_life, 1), 0, random.randint(0, 3))

        insp = Inspection(
            inspection_code=f"INSP-{i+1:06d}",
            fitting_id=fitting.id,
            inspector_id=inspector.id,
            scheduled_date=created,
            completed_date=comp_date,
            status=status,
            visual_condition=vc,
            wear_level=wear,
            corrosion_level=corr,
            damage_type=dmg,
            remarks=f"Routine inspection. Condition: {vc}. Wear: {wear}/10, Corrosion: {corr}/10" if status == "COMPLETED" else None,
            recommended_action="Replace within 6 months" if wear >= 8 else ("Monitor closely" if wear >= 5 else None),
            health_score=hs if status == "COMPLETED" else None,
            created_at=created,
        )
        db.add(insp)

        if (i + 1) % 5000 == 0:
            db.flush()
            print(f"    ... {i+1:,} inspections created")

    print("    Creating 12,000 maintenance tickets...")
    maint_users = [u for u in users if u.role == "MAINTENANCE_ENGINEER"]
    ticket_statuses = ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED"]
    priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    issues = [
        "Wear beyond acceptable limits detected",
        "Corrosion damage requiring treatment",
        "Bolt torque below specification",
        "Rail pad deterioration noted",
        "Clip fatigue observed",
        "Joint gap excessive",
        "Surface cracking visible",
        "Plate displacement detected",
        "Lubrication system malfunction",
        "Signal circuit interruption at joint",
    ]

    for i in range(12000):
        fitting = all_fittings[i % len(all_fittings)]
        maint = maint_users[i % len(maint_users)] if maint_users else None

        days_ago = random.randint(1, 700)
        created = now - timedelta(days=days_ago)
        due = created + timedelta(days=random.choice([7, 14, 21, 30]))

        prio = random.choices(priorities, weights=[15, 40, 30, 15])[0]
        st = random.choices(ticket_statuses, weights=[15, 15, 20, 35, 15])[0]

        comp_date = None
        actual_cost = None
        if st in ["COMPLETED", "CLOSED"]:
            comp_date = created + timedelta(days=random.randint(3, 30))
            actual_cost = round(random.uniform(200, 5000), 2)

        est_cost = round(random.uniform(500, 8000), 2)

        ticket = MaintenanceTicket(
            ticket_code=f"MTK-{i+1:06d}",
            fitting_id=fitting.id,
            assigned_to=maint.id if maint else None,
            priority=prio,
            status=st,
            issue_description=random.choice(issues),
            estimated_cost=est_cost,
            actual_cost=actual_cost,
            created_at=created,
            due_date=due,
            completed_date=comp_date,
        )
        db.add(ticket)
        db.flush()

        hist = MaintenanceHistory(
            ticket_id=ticket.id,
            changed_by=maint.id if maint else users[0].id,
            old_status=None,
            new_status="SCHEDULED",
            notes="Ticket created",
            created_at=created,
        )
        db.add(hist)

        if st != "SCHEDULED":
            hist2 = MaintenanceHistory(
                ticket_id=ticket.id,
                changed_by=maint.id if maint else users[0].id,
                old_status="SCHEDULED",
                new_status=st,
                notes=f"Status updated to {st}",
                created_at=created + timedelta(days=random.randint(1, 5)),
            )
            db.add(hist2)

        if (i + 1) % 3000 == 0:
            db.flush()
            print(f"    ... {i+1:,} tickets created")

    print("    Creating 2,000+ alerts...")
    alert_types = ["WEAR", "CORROSION", "OVERDUE_INSPECTION", "MAINTENANCE_DUE", "CRITICAL_RISK", "QR_DAMAGE"]
    severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    alert_titles = {
        "WEAR": ["High wear detected", "Excessive surface wear", "Accelerated wear pattern"],
        "CORROSION": ["Corrosion detected", "Severe pitting observed", "Rust formation active"],
        "OVERDUE_INSPECTION": ["Inspection overdue", "Scheduled inspection missed", "Overdue by 30+ days"],
        "MAINTENANCE_DUE": ["Preventive maintenance due", "Scheduled service approaching", "Component life expiring"],
        "CRITICAL_RISK": ["Critical risk level reached", "Immediate attention required", "Safety risk detected"],
        "QR_DAMAGE": ["QR code damaged", "QR code unreadable", "QR label peeling"],
    }

    for i in range(2500):
        fitting = all_fittings[i % len(all_fittings)]
        at = alert_types[i % len(alert_types)]
        sev = random.choices(severities, weights=[25, 35, 25, 15])[0]

        days_ago = random.randint(1, 300)
        created = now - timedelta(days=days_ago)

        is_ack = random.random() < 0.5
        is_res = random.random() < 0.3 if is_ack else False

        ack_by = random.choice(users).id if is_ack else None
        ack_at = created + timedelta(hours=random.randint(1, 48)) if is_ack else None
        res_by = random.choice(users).id if is_res else None
        res_at = ack_at + timedelta(hours=random.randint(1, 72)) if is_res else None

        alert = Alert(
            alert_code=f"ALT-{i+1:06d}",
            fitting_id=fitting.id,
            alert_type=at,
            severity=sev,
            title=random.choice(alert_titles[at]),
            description=f"Alert generated for fitting {fitting.fitting_code}. "
                        f"Type: {at}. Severity: {sev}.",
            is_acknowledged=is_ack,
            acknowledged_by=ack_by,
            acknowledged_at=ack_at,
            is_resolved=is_res,
            resolved_by=res_by,
            resolved_at=res_at,
            created_at=created,
        )
        db.add(alert)

        if (i + 1) % 500 == 0:
            db.flush()
            print(f"    ... {i+1:,} alerts created")

    print("    Creating 500+ AI insights...")
    insight_types = ["CRITICAL_RISK", "OVERDUE_INSPECTION", "WEAR", "CORROSION", "MAINTENANCE_DUE"]
    insight_titles = {
        "CRITICAL_RISK": ["Critical deterioration predicted", "Risk level escalating", "Immediate action required"],
        "OVERDUE_INSPECTION": ["Inspection overdue - risk increasing", "Maintenance window missed", "Compliance gap detected"],
        "WEAR": ["Wear trend analysis shows acceleration", "Replacement needed soon", "Wear exceeding predictions"],
        "CORROSION": ["Corrosion spreading faster than expected", "Environmental factors increasing corrosion", "Protective coating failing"],
        "MAINTENANCE_DUE": ["End-of-life prediction approaching", "Component degradation pattern matches replacement criteria", "Preventive replacement recommended"],
    }

    for i in range(600):
        fitting = all_fittings[i % len(all_fittings)]
        it = insight_types[i % len(insight_types)]
        risk = round(random.uniform(20, 95), 1)
        conf = round(random.uniform(0.55, 0.92), 2)

        import json
        factors = {
            "health_score": fitting.health_score,
            "age_years": round((now - fitting.installation_date).days / 365.25, 1) if fitting.installation_date else 0,
            "wear_trend": random.uniform(0.1, 0.9),
            "corrosion_trend": random.uniform(0.05, 0.8),
        }

        insight = AIInsight(
            fitting_id=fitting.id,
            insight_type=it,
            title=random.choice(insight_titles[it]),
            description=f"AI analysis of fitting {fitting.fitting_code} indicates {it.lower().replace('_', ' ')} risk. "
                        f"This is a Decision Support / Prototype Prediction.",
            risk_score=risk,
            confidence=conf,
            factors=json.dumps(factors),
            recommended_action="Schedule priority inspection" if risk >= 60 else "Continue monitoring",
            is_read=random.random() < 0.4,
            created_at=now - timedelta(days=random.randint(1, 150)),
        )
        db.add(insight)

        if (i + 1) % 100 == 0:
            db.flush()
            print(f"    ... {i+1} insights created")

    print("\n[10/10] Committing to database...")
    db.commit()

    total_users = db.query(User).count()
    total_zones = db.query(RailwayZone).count()
    total_divisions = db.query(Division).count()
    total_routes = db.query(Route).count()
    total_vendors = db.query(Vendor).count()
    total_types = db.query(FittingType).count()
    total_fittings = db.query(TrackFitting).count()
    total_inspections = db.query(Inspection).count()
    total_tickets = db.query(MaintenanceTicket).count()
    total_alerts = db.query(Alert).count()
    total_insights = db.query(AIInsight).count()

    print("\n" + "=" * 60)
    print("  SEED COMPLETE!")
    print("=" * 60)
    print(f"  Users:            {total_users:,}")
    print(f"  Zones:            {total_zones}")
    print(f"  Divisions:        {total_divisions}")
    print(f"  Routes:           {total_routes}")
    print(f"  Vendors:          {total_vendors}")
    print(f"  Fitting Types:    {total_types}")
    print(f"  Track Fittings:   {total_fittings:,}")
    print(f"  Inspections:      {total_inspections:,}")
    print(f"  Maintenance Tix:  {total_tickets:,}")
    print(f"  Alerts:           {total_alerts:,}")
    print(f"  AI Insights:      {total_insights:,}")
    print("=" * 60)
    print("\n  Login credentials:")
    print("  Admin:  admin@railsaathi.in / Admin@123")
    print("  Inspector: inspector1@railsaathi.in / Inspector@123")
    print("=" * 60)

    db.close()


if __name__ == "__main__":
    seed()
