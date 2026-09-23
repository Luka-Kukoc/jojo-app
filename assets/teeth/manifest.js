/* Real 3D models / images for teeth.  Key = FDI number (11-18, 21-28, 31-38, 41-48).
   A tooth with no usable entry falls back to the built-in drawing.

   Fields (one of `src` or `sketchfab` is required):
     src        local file. .glb/.gltf -> <model-viewer>; png/jpg/webp/svg -> <img>.
     sketchfab  Sketchfab model id -> shown with the Sketchfab embed viewer instead of a local file.
     crownUp    true if the model/file shows the tooth crown-up (roots down). Default true.
                Set false for upper teeth posed in their anatomical, crown-down position.
     mirror     true to mirror horizontally (reuse a left-side model for the right side).
     credit     attribution line shown under the model (CC BY requires it).

   Files below: University of Dundee, School of Dentistry - "Permanent Teeth" (CC BY 4.0),
   downloaded from https://sketchfab.com/DundeeDental/collections/permanent-teeth-4c0d0548c40c463c8cdceb6e0d08df7f
   They are left-side teeth; uppers are posed crown-down, lowers crown-up.
*/
(function () {
  var CREDIT = 'University of Dundee, School of Dentistry · CC BY 4.0';
  var dir = 'assets/teeth/';
  var upper = {
    1: 'maxillary_left_central_incisor.glb',
    2: 'maxillary_lateral_incisor.glb',
    3: 'maxillary_canine.glb',
    4: 'maxillary_first_premolar.glb',
    5: 'maxillary_second_premolar.glb',
    6: 'maxillary_first_molar.glb',   // variant: maxillary_first_molar_with_cusp_of_carabelli.glb
    7: 'maxillary_second_molar.glb',
    8: 'maxillary_third_molar.glb',
  };
  var lower = {
    1: 'mandibular_left_central_incisor.glb',
    2: 'mandibular_left_lateral_incisor.glb',
    3: 'mandibular_left_canine.glb',
    4: 'mandibular_first_premolar.glb',
    5: 'mandibular_left_second_premolar.glb',
    6: 'mandibular_first_molar.glb',
    7: 'mandibular_second_molar.glb',
    8: 'mandibular_third_molar.glb',
  };
  var assets = {};
  for (var pos = 1; pos <= 8; pos++) {
    assets[20 + pos] = { src: dir + upper[pos], crownUp: false, credit: CREDIT };               // upper left
    assets[10 + pos] = { src: dir + upper[pos], crownUp: false, mirror: true, credit: CREDIT }; // upper right
    assets[30 + pos] = { src: dir + lower[pos], credit: CREDIT };                               // lower left
    assets[40 + pos] = { src: dir + lower[pos], mirror: true, credit: CREDIT };                 // lower right
  }
  window.TOOTH_ASSETS = assets;
})();
