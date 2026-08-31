# RedFlagDaddy brand implementation

Updated: 28 August 2026

The owner-supplied `RedFlagDaddy_CI_Branding_Kit.zip` is the visual source of
truth for the current application work. Its documents are reference material;
they do not override product, safety, privacy or release decisions in the
project backlog.

## Implemented locally

- The existing 1200 x 400 header logo is an exact binary match for the approved
  transparent horizontal lockup in the kit.
- The existing under-construction artwork is an exact binary match for the
  approved campaign asset.
- The crushed horizontal favicon has been replaced with the approved 64 x 64
  emblem. The supplied multi-size ICO, 180 x 180 Apple touch icon, and 256 x
  256 and 512 x 512 app icons are now published as local assets.
- A web app manifest uses the approved dark background and theme colour.
- Application colours now map to the supplied Ink, Midnight, Plum, Violet,
  Pink, Magenta, Lavender, Cloud, Steel and semantic status tokens.
- Results, demo, journey, dashboard, upgrade and admin status colours now use
  the kit's Success, Caution, Danger and Info tokens rather than ad-hoc palette
  shades. Labels and icons remain present so meaning never depends on colour.
- Display typography now uses DM Serif Display; interface typography remains
  Inter with system fallbacks.
- The horizontal header lockup now respects the 180 px minimum and grows to the
  preferred 240 px size on wider screens.
- Ambient backgrounds use violet and pink only. Glass surfaces and glow were
  reduced to follow the kit's premium-restraint guidance.
- The missing-route page now uses the approved emblem, direct recovery copy and
  a 44 px return control; unauthenticated visitors no longer see private app
  navigation on that page.
- Shared inputs and select triggers now use the kit's preferred 48 px height;
  every shared button size and select option is at least 44 px. Focus rings are
  two pixels and use the approved lavender ring token.
- Automated tests protect the token mapping, font selection, icon dimensions
  manifest configuration and semantic-colour usage.

## Release checks still required

- Review every major route on deployed staging at mobile and desktop sizes.
- Confirm text, focus indicators and interactive states meet WCAG AA contrast.
- Verify the favicon, Apple touch icon and install icons on real browsers and
  devices, including circular or rounded platform crops.
- Approve a dedicated 1200 x 630 social-sharing image. The kit contains square
  and portrait social assets, but no asset at the required link-preview ratio.
- Commission the clean SVG/EPS redraw recommended by the kit before print,
  signage, merchandise or other large-format production. The current approved
  masters are raster artwork.

## Usage guardrails

- Use the horizontal lockup at 180 px wide or larger; prefer 240-360 px in
  headers when layout permits.
- Use the emblem, never the squeezed wordmark, for compact icons and avatars.
- Keep large interface areas near-black and use violet/pink as selective
  signals rather than wallpaper.
- Do not recolour, stretch, rotate or reconstruct the supplied logo artwork.
- Do not use colour alone for safe, caution, danger or consent information.
- Retain the product boundary: RedFlagDaddy structures conversation but does
  not determine or prove consent, safety or trustworthiness.
