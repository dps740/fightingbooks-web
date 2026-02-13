#!/bin/bash
FAL_KEY="c0f1713d-6fa5-41a0-8f4e-84defdb39eed:bfb696c0dce01f989089febd9b8990f8"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/fighters"

gen() {
  local file="$1" prompt="$2"
  echo "→ $file"
  local resp=$(curl -s "https://fal.run/fal-ai/flux/schnell" \
    -H "Authorization: Key $FAL_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": $(echo "$prompt" | jq -Rs .), \"image_size\": \"square_hd\", \"num_inference_steps\": 4}")
  local url=$(echo "$resp" | jq -r '.images[0].url // empty')
  if [ -n "$url" ]; then
    curl -s "$url" -o "${OUT}/${file}"
    echo "  ✅ $(stat -f%z "${OUT}/${file}") bytes"
  else
    echo "  ❌ $(echo $resp | head -c 200)"
  fi
  sleep 0.5
}

a() {
  local slug="$1" name="$2" habitat="$3" action="$4" closeup="$5" secrets="$6"
  echo ""
  echo "=== $name ==="
  gen "${slug}.jpg" "${name} portrait, powerful build, natural coloring and markings, natural habitat background, professional wildlife photo, dramatic natural lighting, hyperrealistic, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO BRAND NAMES, clean image only"
  gen "${slug}-habitat.jpg" "${name} ${habitat}, environmental wide shot showing full habitat, wildlife documentary photography, natural behavior, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO BRAND NAMES, clean image only"
  gen "${slug}-action.jpg" "${name} ${action}, intense action moment, wildlife photography, NO WEAPONS NO HUMAN POSES, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO BRAND NAMES, clean image only"
  gen "${slug}-closeup.jpg" "Extreme close-up of ${name} face, ${closeup}, every detail visible, shallow depth of field, intimate wildlife portrait, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO BRAND NAMES, clean image only"
  gen "${slug}-secrets.jpg" "${name} ${secrets}, educational nature scene showing natural behavior, wildlife photography, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO BRAND NAMES, clean image only"
}

echo "=== Regenerating 39 remaining animals ==="

# Real animals (22 remaining)
a "alligator" "American alligator" \
  "floating in Louisiana bayou swamp, cypress trees with Spanish moss, murky green water" \
  "lunging out of water with explosive speed to grab prey, massive jaws snapping shut, water eruption" \
  "armored scaly snout, vertical slit pupils, bumpy textured skin, partially submerged in dark water" \
  "alligator nest with mother guarding eggs, showing protective maternal instinct in swamp setting"

a "anaconda" "Green anaconda" \
  "coiled on a riverbank in Amazon rainforest, massive thick body, tropical vegetation and murky river" \
  "constricting prey underwater in murky Amazon river, powerful coils wrapping tight, showing immense strength" \
  "triangular head with eyes on top, olive green scales with dark oval spots, forked tongue flicking" \
  "anaconda swimming gracefully through flooded Amazon forest, showing aquatic ability despite massive size"

a "black-panther" "Black panther melanistic leopard" \
  "prowling through dense jungle at dusk, sleek black coat with faint rosette pattern visible, green foliage" \
  "leaping between tree branches in the dark, athletic mid-air pounce, glowing eyes catching moonlight" \
  "sleek black face with faint rosette spots visible in light, piercing golden-green eyes glowing, dark fur" \
  "black panther with rosette pattern visible in direct sunlight, showing it is actually a leopard with dark pigmentation"

a "cape-buffalo" "African cape buffalo" \
  "large herd grazing on African savanna, massive dark bodies, oxpecker birds on backs, dusty plains" \
  "charging aggressively with head lowered, massive curved horns aimed forward, dust cloud behind, raw power" \
  "massive boss of fused horns on broad head, dark eyes with intense stare, mud-caked face, battle-scarred" \
  "cape buffalo herd forming defensive circle around calves with adults facing outward, showing cooperative defense"

a "cassowary" "Southern cassowary" \
  "walking through Australian tropical rainforest, vibrant blue neck and red wattle, dense green undergrowth" \
  "kicking forward with massive clawed foot, dagger-like inner toe claw extended, defensive strike, powerful legs" \
  "bright blue and red neck skin, bony casque helmet on head, intense orange eye, prehistoric bird face" \
  "cassowary eating fallen rainforest fruit, showing crucial role as seed disperser for tropical forest ecosystem"

a "cheetah" "Cheetah" \
  "scanning savanna from termite mound lookout, slender spotted body, golden grassland stretching to horizon" \
  "sprinting at full speed chasing gazelle, all four feet off ground in full extension, motion blur on legs" \
  "distinctive black tear marks running from eyes to mouth, amber eyes, spotted golden fur, alert expression" \
  "cheetah mother teaching cubs to hunt by releasing live prey for them to practice chasing"

a "eagle" "Bald eagle" \
  "perched on tall dead tree overlooking Alaskan river valley, snow-capped mountains, vast wilderness" \
  "diving feet-first to snatch fish from water surface, talons extended, wings pulled back, water spray" \
  "white feathered head, sharp curved yellow beak, fierce golden eyes, intense raptor stare" \
  "bald eagle pair working together to build massive nest of sticks high in a tree, showing lifelong pair bond"

a "elephant" "African bush elephant" \
  "family herd walking across vast savanna at golden hour, matriarch leading, dust in warm light, acacia trees" \
  "charging with ears fully spread and trunk raised, massive body in full motion, ground shaking, dust cloud" \
  "wrinkled gray skin, wise small eyes with long lashes, massive tusks, trunk tip showing finger-like grip" \
  "elephant using trunk to spray dust on back for sun protection, showing sophisticated self-care behavior"

a "hippo" "Hippopotamus" \
  "submerged in African river with just eyes ears and nostrils above water, lily pads nearby, calm water" \
  "charging out of water with massive jaws open 150 degrees wide, showing enormous teeth, water cascading off body" \
  "huge wide mouth slightly open showing massive canine teeth, beady eyes, pink-gray skin, water droplets" \
  "hippo secreting red oily substance from skin that acts as natural sunscreen and antibiotic, unique adaptation"

a "honey-badger" "Honey badger" \
  "trotting boldly through African bushveld, distinctive black body with white-gray stripe on back, scrubby terrain" \
  "fearlessly confronting a cobra, standing ground against snake with thick loose skin raised, aggressive stance" \
  "flat broad head with small ears, dark eyes with fierce expression, thick skin around neck, white stripe" \
  "honey badger using a stick to access honey from beehive, showing remarkable tool use and problem-solving intelligence"

a "hyena" "Spotted hyena" \
  "clan resting at communal den, spotted sandy-brown coats, African savanna at dusk, pups playing nearby" \
  "running at full speed in coordinated pack hunt, powerful jaw muscles visible, spotted coat, endurance pursuit" \
  "rounded ears, dark intelligent eyes, spotted sandy coat, powerful jaw structure, alert watchful expression" \
  "hyena clan communicating with variety of whoops and giggles, showing complex social structure led by females"

a "jaguar" "Jaguar" \
  "resting on thick branch overhanging Amazon river, powerful spotted body draped over limb, jungle setting" \
  "diving into murky river to catch caiman, powerful aquatic attack, water splashing, showing unique hunting ability" \
  "massive broad head with powerful jaw, golden coat with distinctive rosettes containing inner spots, green eyes" \
  "jaguar killing caiman with a bite directly through the skull, showing the strongest bite force of any big cat"

a "komodo-dragon" "Komodo dragon" \
  "basking on rocky hillside on Indonesian island, massive reptile body, dry tropical grass and scattered trees" \
  "running with surprising speed across open ground, mouth open showing forked tongue, powerful legs and tail" \
  "scaly armored head, forked yellow tongue flicking, cold reptilian eyes, ancient predator face, rough textured skin" \
  "komodo dragon detecting prey from miles away using forked tongue to taste air particles, showing chemical sensing ability"

a "leopard" "African leopard" \
  "draped across tree branch in African savanna, rosette-spotted coat, dappled shade, relaxed but alert" \
  "hauling heavy prey up into tree with incredible strength, climbing vertically with kill in jaws" \
  "intense green eyes, distinctive rosette pattern, whiskers forward, alert focused expression, golden fur" \
  "leopard stashing prey high in tree fork away from scavengers, showing unique food caching behavior"

a "moose" "Bull moose" \
  "standing in misty Alaskan lake at dawn, massive palmated antlers, water plants hanging from mouth, pine forest" \
  "charging through shallow water with antlers lowered, powerful legs creating huge splashes, autumn rut aggression" \
  "enormous palmated antlers with multiple points, long face with overhanging nose, dark brown fur, bell hanging from chin" \
  "moose diving completely underwater to eat aquatic plants on lake bottom, showing surprising diving ability"

a "octopus" "Giant Pacific octopus" \
  "moving across colorful coral reef, eight arms flowing gracefully, reddish-brown color, ocean floor setting" \
  "jet propelling rapidly through open water with arms trailing behind, ink cloud left behind, escape behavior" \
  "large intelligent eye with horizontal pupil, textured skin changing color, suckers visible on curling arm" \
  "octopus instantly changing color and texture to perfectly match rocky ocean floor, showing incredible camouflage ability"

a "python" "Burmese python" \
  "coiled on jungle floor among fallen leaves, massive thick body with brown blotch pattern, tropical forest" \
  "striking with open mouth at prey, lightning fast lunge, showing heat-sensing pit organs, powerful body uncoiling" \
  "triangular head with heat-sensing pits visible, dark eyes, patterned brown and tan scales, forked tongue" \
  "python using heat-sensing pit organs to detect warm-blooded prey in complete darkness, infrared vision hunting"

a "rhino" "White rhinoceros" \
  "grazing on African grassland, massive gray armored body, wide square lip for grass, dust bath mud on skin" \
  "charging at full gallop with head lowered, horn pointed forward, dust cloud, two tons of momentum" \
  "double horn on broad snout, small eyes, thick folded gray skin with armor-like texture, prehistoric face" \
  "rhino rolling in mud wallow for sun protection and parasite removal, showing essential skin care behavior"

a "walrus" "Pacific walrus" \
  "hauled out on rocky Arctic beach with colony, massive brown bodies, long ivory tusks, cold ocean in background" \
  "using long tusks to haul massive body onto ice floe, powerful neck muscles, Arctic sea ice environment" \
  "whiskered face with small eyes, long ivory tusks, wrinkled thick brown skin, blubbery neck folds" \
  "walrus using sensitive whiskers to find clams on dark ocean floor by touch, showing specialized foraging"

a "wolf" "Gray wolf" \
  "pack traveling through snowy mountain landscape, alpha pair leading, pine forest, winter wilderness" \
  "pack coordinated hunt surrounding elk in deep snow, wolves flanking from multiple angles, teamwork in action" \
  "intense yellow eyes, thick gray and white fur, scarred muzzle, alert pointed ears, wise predator expression" \
  "wolf pack howling together at dusk to communicate territory and strengthen pack bonds, social behavior"

a "wolverine" "Wolverine" \
  "traversing deep snow in boreal forest, stocky dark brown body, powerful build for its small size, winter setting" \
  "aggressively defending food cache from much larger bear, standing ground fearlessly, showing incredible aggression" \
  "dark face with lighter stripe, small fierce eyes, powerful jaws, thick dark brown fur, compact muscular build" \
  "wolverine traveling 30 miles in a single day through deep mountain snow, showing incredible endurance and strength"

# Fantasy creatures (5)
a "dragon" "Fire-breathing dragon" \
  "perched atop volcanic mountain peak, massive wings spread, molten lava flows below, dark stormy sky" \
  "breathing enormous stream of fire across night sky, wings fully extended, devastating power display" \
  "armored scaled face with glowing amber eyes, smoke curling from nostrils, horn crown, ancient and intelligent" \
  "dragon curled protectively around clutch of glowing eggs in volcanic cave, showing parental guarding behavior"

a "griffin" "Griffin eagle-lion hybrid" \
  "perched on mountain cliff edge overlooking vast kingdom, eagle head and wings with lion body, majestic stance" \
  "diving from sky with eagle talons extended and lion claws ready, powerful aerial hunting strike" \
  "sharp eagle beak and fierce golden eyes transitioning to lion mane, feathers meeting fur, noble expression" \
  "griffin grooming its eagle feathers with lion paws, showing the dual nature of this mythical creature"

a "kraken" "Giant kraken sea monster" \
  "lurking in deep dark ocean, massive tentacles spread wide, bioluminescent deep sea creatures around, abyss" \
  "massive tentacles wrapping around a wooden sailing ship, pulling it into dark ocean depths, stormy seas" \
  "enormous eye the size of a dinner plate, dark pupil reflecting light, scarred ancient skin, deep ocean" \
  "kraken using color-changing skin to blend into deep ocean darkness, showing cephalopod camouflage ability"

a "phoenix" "Phoenix fire bird" \
  "perched in ancient golden tree, magnificent plumage of red orange and gold flames, magical glowing forest" \
  "bursting into brilliant flames during rebirth cycle, feathers becoming fire, blinding golden light explosion" \
  "noble bird face with fiery crest feathers, glowing golden eyes, flames dancing along beak and feathers" \
  "phoenix rising reborn from pile of ashes as tiny chick, showing the legendary cycle of death and rebirth"

a "cerberus" "Cerberus three-headed guard dog" \
  "guarding dark entrance to underworld, three massive mastiff heads alert, volcanic rocky terrain, eerie glow" \
  "all three heads snarling and lunging in different directions, massive body in attack stance, chains breaking" \
  "center head with fierce red eyes, massive fangs, dark matted fur, drool dripping, two other heads flanking" \
  "one head sleeping while other two stand guard, showing how the three heads take turns resting"

a "chimera" "Chimera lion-goat-snake hybrid" \
  "standing on rocky Greek mountainside, lion head and body, goat head on back, snake tail, mythological setting" \
  "lion head breathing fire while goat head rams and snake tail strikes, triple simultaneous attack" \
  "fierce lion face with mane, goat horns visible behind, snake tail hissing over shoulder, three creatures in one" \
  "chimera with each head eating different food showing different dietary needs of each animal component"

a "hydra" "Lernaean hydra multi-headed serpent" \
  "emerging from dark murky swamp, multiple serpent heads on long necks, poisonous swamp water, eerie mist" \
  "multiple heads striking simultaneously from different angles, impossible to defend against, toxic breath visible" \
  "central serpent head with venomous fangs, forked tongue, scaled skin glistening, cold reptilian eyes" \
  "hydra regrowing two new heads where one was cut off, showing the legendary regeneration ability"

a "manticore" "Manticore lion-scorpion hybrid" \
  "prowling through Persian desert ruins at sunset, lion body, human-like face, scorpion tail, ancient columns" \
  "launching venomous spines from scorpion tail while charging with lion speed, desert sand flying" \
  "almost human-like face with lion features, rows of sharp teeth, intelligent malevolent eyes, wild mane" \
  "manticore using scorpion tail to sense vibrations in the ground, detecting approaching prey from distance"

a "basilisk" "Basilisk king of serpents" \
  "coiled in dark ancient stone chamber, crown-like crest on head, deadly gaze, crumbling ruins" \
  "rearing up with hood spread and crown crest flared, deadly petrifying gaze, venom dripping from fangs" \
  "serpent face with crown-like crest, hypnotic golden eyes with vertical slit pupils, jeweled scales" \
  "basilisk leaving trail of withered dead plants in its wake, showing the legendary lethal aura"

# Dinosaurs (8)
a "tyrannosaurus-rex" "Tyrannosaurus Rex" \
  "striding through Late Cretaceous forest, massive body, tiny arms, dense prehistoric ferns and conifers" \
  "lunging forward with massive jaws open, bone-crushing teeth visible, powerful legs propelling forward, dust and debris" \
  "enormous skull with forward-facing eyes for binocular vision, serrated banana-sized teeth, scarred snout" \
  "T-Rex using excellent binocular vision to spot prey from great distance, showing advanced predator eyesight"

a "velociraptor" "Velociraptor" \
  "pack hunting in Cretaceous desert scrubland, feathered body, slender build, sandy rocky terrain" \
  "leaping with enlarged sickle-shaped toe claw extended for slashing attack, feathered arms spread for balance" \
  "intelligent eyes on feathered bird-like head, sharp teeth in narrow snout, feathered crest, turkey-sized" \
  "velociraptor covered in feathers like a modern bird, showing the dinosaur-bird evolutionary connection"

a "triceratops" "Triceratops" \
  "grazing in Late Cretaceous floodplain, three horns and massive frill, fern meadows, volcano in distance" \
  "charging with three horns lowered in defensive stance against predator, massive frill protecting neck, dust cloud" \
  "three distinct horns, massive bony frill with intricate patterns, parrot-like beak, small eye, armored face" \
  "triceratops using bony frill flushed with blood to regulate body temperature and signal to other triceratops"

a "spinosaurus" "Spinosaurus" \
  "wading in Cretaceous river system, massive sail on back, long crocodile-like snout, fish visible in water" \
  "plunging long snout into water to catch large fish, sail fully visible, semi-aquatic hunting behavior, river spray" \
  "long narrow crocodile-like snout with conical teeth for gripping fish, small crest, nostrils high on skull" \
  "spinosaurus swimming with paddle-like tail propulsion, showing it was the first known semi-aquatic dinosaur"

a "stegosaurus" "Stegosaurus" \
  "walking through Jurassic forest clearing, distinctive double row of diamond plates along back, tail spikes, ferns" \
  "swinging powerful tail with four sharp thagomizer spikes at attacking predator, defensive weapon display" \
  "tiny head relative to body, small beaked mouth, bony plates visible along neck, gentle herbivore expression" \
  "stegosaurus plates flushing red with blood flow for temperature regulation, functioning as biological solar panels"

a "ankylosaurus" "Ankylosaurus" \
  "grazing in Late Cretaceous meadow, fully armored body covered in bony plates and spikes, massive tail club" \
  "swinging enormous bony tail club at attacking predator, devastating defensive weapon, ground impact crater" \
  "armored head with bony horns at corners, small eyes peering from heavily plated skull, beak mouth" \
  "ankylosaurus club tail showing fused vertebrae and massive bone knob, nature's most powerful melee weapon"

a "pteranodon" "Pteranodon" \
  "soaring over Cretaceous ocean, massive wingspan, long head crest, waves and cliffs below, blue sky" \
  "diving toward ocean surface to scoop up fish in long toothless beak, wings folded back, aerial fishing" \
  "long backward-pointing head crest, toothless beak, large eyes for spotting fish from height, leathery skin" \
  "pteranodon launching from cliff using all four limbs to vault into air, showing unique quad-launch takeoff"

a "brachiosaurus" "Brachiosaurus" \
  "towering above Jurassic forest canopy, incredibly long neck reaching treetops, small head, massive body" \
  "rearing up on hind legs to reach even higher branches, showing incredible height and reach, forest trembling" \
  "tiny head at end of enormously long neck, nostril crest on top of skull, gentle plant-eating expression" \
  "brachiosaurus swallowing stones as gastroliths to help grind tough plant material in stomach, digestive adaptation"

echo ""
echo "=== ALL COMPLETE ==="
echo "Generated 195 images (39 animals × 5 images)"
