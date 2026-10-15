# Sonawg

Sonification + atmospheric gravity waves: a synthetic listening study of
horizontal wavelength scales and activity around a tracked source.

Listen at https://jimmydx.github.io/Sonawg/ using stereo headphones.
The reference player provides seven analytical calibration patterns, each with three-band
and 24-band pitch mappings and source-following/fixed observer controls.
Each comparison is 60 seconds, representing two simulated hours on a 4 km grid.
The synchronized animation is 1600 × 900 at 2 fps.

Assigned pitch is 32,000 / wavelength_km Hz. Area-weighted RMS controls
amplitude in eight overlapping compass sectors. North is front; east is right.
Direction describes activity location, not propagation. Physical field sign,
phase and oscillation frequency are not preserved. These patterns do not
establish gravity-wave identification in real data.

For binaural samples and animation audio, turn off extra Spatialize Stereo
processing and head tracking. The browser uses binaural audio. For downloaded
Dolby Atmos samples, use a compatible native player/headphones and Spatial
Audio Fixed. Actual device decoding and human
front/back localization remain listening checks. The Atmos samples preserve
encoded frames with boundary precision of 32 ms; binaural comparisons last
exactly 60 seconds. The full spatial export is also available in the release.

First listen without the animation: identify dominant scale, strongest
direction and the appearance of another scale. Record ambiguities in the
listening worksheet before comparing simple/detailed and following/fixed.
All gains stay fixed; quiet intervals are intentional.

The site has no analytics, accounts or data submission. The worksheet stays
with the listener. Mapping settings and numerical validation are included.

Playback documentation:
- https://support.apple.com/en-gb/guide/airpods/dev00eb7e0a3/web
- https://support.apple.com/en-ie/guide/logicpro/lgcpadd22fe4/mac

## All-around exercise

Open https://jimmydx.github.io/Sonawg/?case=surround for an audio-first guessing
task. Twenty-four packets visit all eight directions, with each direction
receiving all three wavelength brackets once. Packet centers stay 440 km from
a fixed observer. Smooth 1.5-second fade-ins and fade-outs overlap neighboring
events by 2.2 seconds. The three-band and 24-band versions use the same fields
and the existing fixed gain. Reveal the animation and answer key after listening.
The worksheet provides cue-center times without revealing directions or scales.
Numerical tests validate isolated packet sectors and wavelength brackets;
overlapping packets can legitimately produce multiple audible answers.

## Interactive transect lab

Open https://jimmydx.github.io/Sonawg/?lab=transect. Choose one of the nine
frozen patterns and a simulated minute. Drag or enter the center of a 960 km
transect, rotate its bearing, and compare signed-value pitch, crest-crossing
pulses, and rapid spatial audification. Reset transect places the line through
the selected isolated packet; the default is the stationary 120 km packet.

The lab samples the original 4 km grid with bilinear interpolation. The field
stays frozen throughout replay. Signed pitch is 300 * 2^(value/2) Hz; zero
is the reference tone, not silence. Pulses mark positive local maxima, with
optional low plucks for negative troughs. Audification reads the whole profile
rapidly four times per second for eight seconds; its speed is separate from
the slow scanning clock. Shorter projected wavelengths produce higher reading
frequencies, which are not the field's physical frequencies. Windows suppress
burst boundary discontinuities. The default 32,000 km/s gives about 533, 267,
and 133 Hz for aligned 60, 120, and 240 km structures.

Begin with centered audio; optionally enable scanner-position HRTF rendering.
This is browser-generated stereo, separate from the Logic binaural reference
clips. No browser Atmos decoding is assumed. Turn off additional Spatialize
Stereo and head tracking. Generic HRTFs vary by browser; human localization
and interpretability still require listening. Fixed gains differ by method,
so perceived loudness cannot be compared as a field measurement across methods.

Download the profile CSV and mapping settings JSON to record a setup. The
setup-link button records the frozen field, time, geometry, method and controls.
Files use classic local scripts without a server requirement for the offline
lab. On iPhone, use the online page in Safari; Files/Quick Look may not execute
local HTML scripts. Numerical validation is in `transect-validation.json`.

### Circular wave with increasing crest spacing

Open https://jimmydx.github.io/Sonawg/?lab=transect&pattern=radial_chirp&method=pulses.
The listener is at the center of circular waves with prescribed phase
`2*pi/0.24*log(1+0.24*r/48) - 2*pi*t/1200`, with radius in km and time in seconds.
Local wavelength grows as `48 + 0.24*r` km; it is about 278 km at 960 km radius.
The default 960 km NE transect starts at the observer and goes outward.
Increasing gaps between plucks expose the increasing crest separation.
The inner 24 km is smoothly softened; 48 km is the phase-law limit at the center.

“Preview outward motion (silent)” shows a 20-minute phase cycle in eight seconds.
Audio stops during this preview. Stopping or finishing restores the chosen
frozen snapshot; Play / replay then scans that snapshot using any of the three
methods. Larger rings have greater spacing, and individual phase crests move
outward as time increases. This is an analytical radial chirp, not a physical
dispersion calculation; it does not establish a gravity-wave mode or mechanism.
