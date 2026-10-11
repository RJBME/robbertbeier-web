"""Two-chamber wall-mount case for D1 Mini + GY-BME280. Outputs base/lid STL + preview PNGs.
Frame (installed): x right, y up the wall, z out from the wall (z=0 is the back against the wall)."""
import sys, numpy as np, trimesh
from manifold3d import Manifold, CrossSection, JoinType

OUT = sys.argv[1]
E = 0.01
W, H = 46.0, 56.0        # outer footprint
R = 4.0                  # corner radius
T = 2.0                  # wall
FLOOR = 2.0              # back thickness
D = 14.0                 # base depth (back to rim)
LT = 2.0                 # lid plate
LIP_H, LIP_T, FIT = 2.5, 1.2, 0.2
SENS_TOP = 24.0          # sensor chamber is y 2..24, divider 24..26, D1 chamber 26..54
DIV = 2.0
USB_Y0, USB_Y1 = 33.5, 46.5   # cable slot (D1 board centred at y=40)

def rrect(w, h, r):
    return CrossSection.square([w - 2 * r, h - 2 * r]).translate([r, r]).offset(r, JoinType.Round, 2.0, 64)

def box(x, y, z, sx, sy, sz):
    return Manifold.cube([sx, sy, sz]).translate([x, y, z])

def countersink(x, y):
    shaft = Manifold.cylinder(FLOOR + 2 * E, 1.8, 1.8, 48).translate([x, y, -E])
    cone = Manifold.cylinder(1.6 + E, 1.8, 3.4, 48).translate([x, y, FLOOR - 1.6])
    return shaft + cone

# ---------- base ----------
base = Manifold.extrude(rrect(W, H, R), D)
base -= Manifold.extrude(rrect(W - 2 * T, H - 2 * T, R - T), D).translate([T, T, FLOOR])
base += box(T - E, SENS_TOP, FLOOR - E, W - 2 * T + 2 * E, DIV, D - FLOOR + E)          # divider
base -= box(10, SENS_TOP - E, D - 5, 11, DIV + 2 * E, 5 + E)                          # wire notch
base -= box(-E, USB_Y0, -E, T + 2 * E, USB_Y1 - USB_Y0, D + 2 * E)                     # USB cable slot
for y in (6.0, 11.0, 16.0):                                                           # sensor side vents
    base -= box(-E, y, 4, T + 2 * E, 1.8, 7)
    base -= box(W - T - E, y, 4, T + 2 * E, 1.8, 7)
for x in np.arange(9.0, 34.0, 4.5):                                                   # sensor bottom vents
    base -= box(x, -E, 4, 1.8, T + 2 * E, 7)
for x in np.arange(14.0, 33.0, 4.5):                                                  # heat exits the top
    base -= box(x, H - T - E, 4, 1.8, T + 2 * E, 7)
for cx in (36.6, 40.4):                                                              # cable slot: leak + sump cables
    base -= Manifold.cylinder(T + 2 * E, 2.6, 2.6, 40).rotate([-90, 0, 0]).translate([cx, -E, 7.5])
base -= box(36.6, -E, 4.9, 3.8, T + 2 * E, 5.2)
base -= countersink(40.8, 40.0)    # beside the D1 Mini
base -= countersink(8.0, 13.0)     # sensor chamber, left

# ---------- lid (built in installed position, then flipped for printing) ----------
lid = Manifold.extrude(rrect(W, H, R), LT).translate([0, 0, D])
lip_o = rrect(W - 2 * T - 2 * FIT, H - 2 * T - 2 * FIT, R - T - FIT)
lip_i = rrect(W - 2 * T - 2 * FIT - 2 * LIP_T, H - 2 * T - 2 * FIT - 2 * LIP_T, max(R - T - FIT - LIP_T, 0.5))
lip = Manifold.extrude(lip_o - lip_i, LIP_H + E).translate([T + FIT, T + FIT, D - LIP_H])
lip -= box(-E, USB_Y0 - 0.5, D - LIP_H - 1, T + FIT + LIP_T + 1, USB_Y1 - USB_Y0 + 1, LIP_H + 2)   # clear the cable
lip -= box(-E, SENS_TOP - 0.6, D - LIP_H - 1, W + 2 * E, DIV + 1.2, LIP_H + 2)                    # clear the divider
lid += lip
for y in (6.0, 10.0, 14.0, 18.0):                                                   # vents over the sensor
    lid -= box(11, y, D - 1, 24, 1.6, LT + 2)
lid_print = lid.rotate([0, 180, 0]).translate([W, 0, D + LT])                         # outer face down

def to_trimesh(m):
    mesh = m.to_mesh()
    return trimesh.Trimesh(vertices=np.array(mesh.vert_properties)[:, :3], faces=np.array(mesh.tri_verts))

tb, tl, tlp = to_trimesh(base), to_trimesh(lid), to_trimesh(lid_print)
for name, t in (('base', tb), ('lid', tlp)):
    assert t.is_watertight, name
    t.export(f'{OUT}/climate-case-{name}.stl')
    print(name, 'bounds', np.round(t.bounds, 2).tolist(), 'vol cm3', round(t.volume / 1000, 2))

# ---------- leak puck (floor probe for the basement unit) ----------
PD, PH, FEET = 40.0, 8.0, 3.0           # puck diameter, body height, foot height
puck = Manifold.cylinder(PH, PD / 2, PD / 2 - 1.5, 96).translate([0, 0, FEET])
for a in (90, 210, 330):
    rad = np.radians(a)
    puck += Manifold.cylinder(FEET + E, 3.0, 3.0, 40).translate([14 * np.cos(rad), 14 * np.sin(rad), 0])
for x in (-8.0, 8.0):
    puck -= Manifold.cylinder(PH + FEET + 2, 1.35, 1.35, 32).translate([x, 0, -1])       # M3 self-tapping pilot
    puck -= Manifold.cylinder(2.0, 3.3, 3.3, 40).translate([x, 0, FEET + PH - 1.5])      # seat for the screw head
puck -= box(-1.75, -1.75, FEET + PH - 2.5, PD / 2 + 2, 3.5, 3)                          # cable groove to the edge
puck -= box(-8, -1.75, FEET + PH - 2.5, 16, 3.5, 3)                                     # groove between the screws
tp = to_trimesh(puck.rotate([180, 0, 0]).translate([0, 0, FEET + PH]))   # printed top-face down, feet up
assert tp.is_watertight
tp.export(f'{OUT}/leak-puck.stl')
print('puck bounds', np.round(tp.bounds, 2).tolist())

