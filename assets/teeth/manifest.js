/* Real 3D models / images for teeth.  Key = FDI number (11-18, 21-28, 31-38, 41-48).
   A tooth with no usable entry falls back to the built-in drawing.

   Fields (one of `sketchfab` or `src` is required):
     sketchfab  Sketchfab model id -> shown with the Sketchfab embed viewer (needs internet, no download).
     src        local file. .glb/.gltf -> <model-viewer>; png/jpg/webp/svg -> <img>.
     crownUp    true if the model/file shows the tooth crown-up (roots down). Default true.
                Set false for upper teeth shown in their anatomical, crown-down position.
     mirror     true to mirror horizontally (reuse a left-side model for the right side).
     credit     attribution line shown under the model (CC BY requires it).

   Entries below: University of Dundee, School of Dentistry - "Permanent Teeth" (CC BY 4.0)
   https://sketchfab.com/DundeeDental/collections/permanent-teeth-4c0d0548c40c463c8cdceb6e0d08df7f
   The models are left-side teeth; uppers are posed crown-down, lowers crown-up.
*/
(function () {
  var CREDIT = 'University of Dundee, School of Dentistry · CC BY 4.0';
  var upper = {
    1: 'c8a7c2d9280d4c92bc651cfa1459866a', // Maxillary Left Central Incisor
    2: '5e89ddbfc6454e2e8e09c645574b8932', // Maxillary Lateral Incisor
    3: 'bd930c9b9da14f2a9a8c9b130b0e08a2', // Maxillary Canine
    4: 'f9b48a29d34f4923b683433f030c5c70', // Maxillary First Premolar
    5: '69f3142830064588b000b04bea0ee09f', // Maxillary Second Premolar
    6: 'e719a474ef7e4bd7abec508f85f1e984', // Maxillary First Molar  (variant with Cusp of Carabelli: 9117c7a9bf0848f29bc4e85931697e7b)
    7: 'e035713849d1438791306e25235ac452', // Maxillary Second Molar
    8: '1b3c50ded70c4b6297d4526a733a9cf1', // Maxillary Third Molar
  };
  var lower = {
    1: '90dcbf474e5a4d97b8783b7eb2b9c4b7', // Mandibular Left Central Incisor
    2: '00fa4f74e10b4769830bf60469c65e27', // Mandibular Left Lateral Incisor
    3: '1082011ab5aa46bb96b2af6a02a4ec0c', // Mandibular Left Canine
    4: '935637a703dc49eb9eeec9b15a8a5c4c', // Mandibular First Premolar
    5: 'fe59fe04725446479bc1115bb12d0ad8', // Mandibular Left Second Premolar
    6: 'e1c919d6603846eca873154eeededdd6', // Mandibular First Molar
    7: 'b77dcbc5052e4740b87cdb1964649742', // Mandibular Second Molar
    8: '561bb06b3b084b84978163906de1c2b5', // Mandibular Third Molar
  };
  var assets = {};
  for (var pos = 1; pos <= 8; pos++) {
    assets[20 + pos] = { sketchfab: upper[pos], crownUp: false, credit: CREDIT };               // upper left
    assets[10 + pos] = { sketchfab: upper[pos], crownUp: false, mirror: true, credit: CREDIT }; // upper right
    assets[30 + pos] = { sketchfab: lower[pos], credit: CREDIT };                               // lower left
    assets[40 + pos] = { sketchfab: lower[pos], mirror: true, credit: CREDIT };                 // lower right
  }
  window.TOOTH_ASSETS = assets;
})();
