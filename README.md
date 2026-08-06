# Mini Mapper

A map of every depth Jan has measured himself, reduced to **MLLW** — the datum a
chart is printed to — so readings taken at different tides are comparable with
each other and with the NOAA survey.

Single file, no build step. Open `index.html`, or serve the folder:

    python3 -m http.server 8791 --directory .

Intended for `janfishes/minimapper` on GitHub Pages, alongside
[`janfishes/tideboard`](https://janfishes.github.io/tideboard/) and
[`janfishes/WTF`](https://janfishes.github.io/WTF/).

## Why it exists

Across the BlueTopo tiles covering this water, **81% of the cells are
interpolated fill rather than measurement**, and where green topobathy lidar
could not see into tannic water it filled a deep hole in off the bar beside it.
Crook's Corner is the proof: the survey puts the bottom there at about 1.5 ft,
the hole holds 8–10, and there is no measurement within 170 m to have got it
right. No amount of interpolation fixes that. A sounding does.

But a raw sounding is worthless six hours later, because it was taken on a tide
that has gone. So everything here is reduced:

    depth at MLLW = reading + (transducer below waterline) − tide at that spot, that minute

The tide is *that position's* own — the inlet prediction shifted by the lag there
and scaled by the height model there. Two readings on the same hole four hours
apart therefore land on the same number, which is the test of whether any of
this works.

## What it does

- **Map** — every sounding, coloured by depth at MLLW over USGS ImageryTopo, the
  same imagery WTF draws. Tap a dot for its numbers and what the survey claims at
  that point. The surveyed contours can be drawn underneath for comparison.
- **Log** — GPS position, a typed depth, a method. Tape measure, lead line and
  castable sonar all read from the surface, so their offset is a certain **0** and
  the field is locked; only a boat sounder asks for one.
- **Type a position** — degrees and decimal minutes, the way a plotter shows
  them, for a reading taken away from the phone.
- **Import** — GPX off the plotter card, or CSV from anything (including
  `tides/tools/reduce_soundings.py`'s own output).
- **Spots** — median and spread per named spot, and one button to push that
  median into the tide board as its `soundedFt`.

## The traps, all of them measured rather than assumed

- **The ACTIVE LOG is the file worth exporting.** On the ECHOMAP, *Save Active
  Track* keeps geometry and throws away the timestamps and the depths. The
  saved track `26-JUN-23 EDGEWATER` came out with 570 points, no time, no depth;
  `ACTIVE LOG` had time and depth on all 5,950. It is a rolling buffer — export
  before it wraps.
- **Garmin writes metres even when the screen says feet.** Read as metres the ICW
  at Dunlawton comes out 15.7–21.8 ft against a ~12 ft charted channel; read as
  feet, 4.8–6.6 ft, which would have had him aground. Converted once, on import,
  and stated in the import summary.
- **The offset is what bites, not the clock.** At Crook's Corner 15 minutes of
  clock error costs 0.15 ft and an hour costs 0.6 — but a transducer offset typed
  wrong is systematic, invisible, and wrong in every reading forever. Hence the
  method picker.
- **A timestamp with no zone is read as LOCAL and said so.** Four hours wrong
  here is the entire 2.2 ft swing.
- **`depth_ft_mllw` is never read as a raw reading** on CSV import. It is already
  reduced; reading it as a reading subtracts the tide twice and the result looks
  perfectly plausible.

## Shared state with the tide board

Both apps live on `janfishes.github.io`, so they share a localStorage area. Mini
Mapper **reads** the tide board's calibrations — `tide-lags`, `tide-positions`,
`tide-added-spots` — which is why it has no calibration screen of its own: a lag
Jan times on the water belongs to the board, and improves every sounding here
the next time *Re-reduce everything* is run. It **writes** exactly one key,
`tide-sounded`, which is how a median here becomes the depth the board prints.

The footer says which is in force. If the two are ever served from different
origins the sharing stops silently and the baked built-ins take over.

## Things that must stay in lockstep

| Thing | Where else it lives | What breaks |
|---|---|---|
| `BUILTIN_LOCATIONS` | tideboard `index.html` | the same sounding reduces differently in the two apps |
| `depth/*.json` + `DEPTH_DATA_V` | WTF `depth/`, tideboard `depth/` | a stale cache serves blocks on the old datum forever |
| the reduction | `tides/tools/reduce_soundings.py` | the phone and the Mac disagree about a depth |

The JS reduction was checked against the Python on the 8-6-2026 export: row 1
Python 1.70 ft of tide / 9.20 ft MLLW, JS 1.6966 / 9.1934. Re-run that check
after touching either.

**The depth blocks are cut at MLLW** (WTF v458 onward) and nothing in this app
may apply the old 2.25 ft NAVD88 offset. That bug — leaving the subtraction in
after the data moved — printed every depth 2.25 ft shallow in `depth_at.py` and
looked entirely normal.

## Files

    index.html          the app
    depth/*.json        contour blocks, copied from WTF (see lockstep above)
    manifest.json       PWA manifest
    sw.js               stale-while-revalidate shell + library cache
    icon-*.png          rendered from ~/Desktop/Mini Mapper Files/MiniMapper-icon.svg

Icon masters are on the Desktop in `Mini Mapper Files/`. Render with
`qlmanage -t -s 2048` then `sips -z` down — rsvg-convert and ImageMagick are not
installed on this Mac. The 32 px favicon is inline in `index.html` and the header
copy is inline SVG in the `<h1>`: **three places** to update on any icon change.

## Not a chart

A depth measured once was true once, on one line, at one state of tide. This
coast shoals and moves. Nothing in here is a substitute for eyes on the water.
