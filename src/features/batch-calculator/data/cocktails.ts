import type { CocktailRecipe } from "../types"

export const COCKTAIL_DATA: CocktailRecipe[] = [
  {
    id: 95,
    name: "Autumn Bloom Mocktail",
    method: "Shake",
    instructions: "1. Add all ingredients (except cider) to a shaker with ice.\n2. Shake briefly to chill.\n3. Strain into a glass with fresh ice.\n4. Top with sparkling cider and stir gently.",
    abv: 0,
    glassType: "Highball",
    season: "Fall 2025",
    image: "/cocktails/autumn-bloom-mocktail-v2.png",
    ingredients: [
      { name: "Sparkling Apple Cider", amount: "3", unit: "oz", orderUnit: "liters" },
      { name: "Pear Nectar/Juice", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Orange Juice", amount: "1", unit: "oz", orderUnit: "gallons" },
      { name: "Cinnamon Syrup", amount: "0.75", unit: "oz", orderUnit: "quarts" },
      { name: "Mint sprig", amount: "1", unit: "each", orderUnit: "each" },
      { name: "Lavender spring", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 96,
    name: "Blackberry Collins",
    method: "Shake",
    instructions: "1. Combine vodka, lemon juice, simple syrup, and blackberry puree into a cocktail shaker filled with ice.\n2. Shake until ingredients are properly chilled and strain into a collins glass filled with ice.\n3. Top off with ginger beer.\n4. Add edible gold dust.",
    featured: true,
    abv: 9.2,
    glassType: "Highball",
    season: "Summer 2025",
    image: "/cocktails/blackberry-collins-v2.png",
    ingredients: [
      { name: "Vodka", amount: "1.5", unit: "oz", orderUnit: "liters" },
      { name: "Lemon Juice", amount: "0.75", unit: "oz", orderUnit: "quarts" },
      { name: "Simple Syrup", amount: "0.75", unit: "oz", orderUnit: "quarts" },
      { name: "Blackberry Puree", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Ginger Beer", amount: "3", unit: "oz", orderUnit: "12oz can" },
      { name: "Blackberry", amount: "1", unit: "each", orderUnit: "each" },
      { name: "Mint Leaf", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 97,
    name: "Blue and Yellow Mimosa",
    method: "Build",
    instructions: "1. Add orange juice and prosecco into a champagne glass.\n2. Add blue curacao slowly into the side of the glass.",
    abv: 6.6,
    glassType: "Flute",
    season: "Spring 2025",
    image: "/cocktails/blue-yellow-mimosa-v2.png",
    ingredients: [
      { name: "Prosecco", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Orange Juice", amount: "2", unit: "oz", orderUnit: "quarts" },
      { name: "Blue Curacao", amount: "0.25", unit: "oz", orderUnit: "liters" }
    ],
  },

  {
    id: 98,
    name: "Classic Pisco Sour",
    method: "Shake",
    instructions: "1. Add Pisco, Lime Juice, Simple Syrup, and Egg White to a shaker and dry-shake (without ice) vigorously. 2. Add ice and shake again until well-chilled. 3. Strain into a chilled glass (Timeless Cocktail). 4. Garnish with Angostura bitters drops.",
    abv: 21.3,
    glassType: "Coupe",
    season: "Summer 2025",
    image: "/cocktails/classic-pisco-sour-v2.png",
    ingredients: [
      { name: "Pisco", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Lime Juice", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Simple Syrup", amount: "0.75", unit: "oz", orderUnit: "quarts" },
      { name: "Egg White", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 99,
    name: "Cranberry Cinnamon Whiskey Sour",
    method: "Shake",
    instructions: "1. Combine bourbon, lemon, syrup, bitters and foam into a cocktail shaker filled with ice.\n2. Shake until ingredients are properly chilled.\n3. Strain in ice filled rocks glass.\n4. Garnish with 3 cranberry skewer",
    abv: 18.5,
    glassType: "Rocks",
    season: "Fall 2025",
    image: "/cocktails/cranberry-cinnamon-whiskey-sour.png",
    ingredients: [
      { name: "Bourbon", amount: "1.5", unit: "oz", orderUnit: "liters" },
      { name: "Lemon Juice", amount: "0.75", unit: "oz", orderUnit: "quarts" },
      { name: "Cranberry Cinnamon Syrup", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Angostura Bitters", amount: "1", unit: "dash", orderUnit: "4oz bottle" },
      { name: "Fee foam", amount: "1", unit: "dash", orderUnit: "4oz bottle" },
      { name: "Cranberries", amount: "3", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 100,
    name: "Espresso Martini",
    method: "Shake",
    instructions: "1. Combine vodka, espresso, and coffee liqueur into a shaker with lots of ice.\n2. Shake hard for 15 seconds (this creates the foam).\n3. Pour into a chilled glass.\n4. Garnish with 3 coffee beans.",
    featured: true,
    abv: 18.9,
    glassType: "Coupe",
    season: "Fall 2025",
    image: "/cocktails/espresso-martini.png",
    ingredients: [
      { name: "Vodka", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Espresso", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Kahlua (Coffee Liqueur)", amount: "0.5", unit: "oz", orderUnit: "liters" },
      { name: "Simple Syrup", amount: "0.25", unit: "oz", orderUnit: "quarts" },
      { name: "Coffee Bean", amount: "3", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 101,
    name: "Maple Bourbon Cider",
    method: "Shake",
    instructions: "1. Combine bourbon, apple cider, maple syrup, and a splash of lemon juice into a Shaker with ice.\n2. Shake well to ensure the maple syrup integrates with the cold cider.\n3. Garnish with a cinnamon stick or an apple slice.",
    featured: true,
    abv: 11.9,
    glassType: "Rocks",
    season: "Fall 2025",
    image: "/cocktails/maple-bourbon-cider.png",
    ingredients: [
      { name: "Bourbon", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Apple Cider", amount: "4", unit: "oz", orderUnit: "gallons" },
      { name: "Lemon Juice", amount: "0.25", unit: "oz", orderUnit: "quarts" },
      { name: "Maple Syrup", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Cinnamon", amount: "1", unit: "each", orderUnit: "each" },
      { name: "Green Apple Slice", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 113,
    name: "Master",
    method: "Build",
    instructions: "Hdjdbdbbdd",
    glassType: "Served Up",
    season: "Spring 2026",
    ingredients: [
      { name: "Vodka", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Simple sirup", amount: "1", unit: "oz", orderUnit: "quarts" }
    ],
  },

  {
    id: 102,
    name: "Old Fashioned",
    method: "Build",
    instructions: "1. Combine all ingredients in a tin filled with ice.\n2. Stir until well-chilled.\n3. Strain into a rocks glass filled with fresh ice.",
    abv: 32.4,
    glassType: "Rocks",
    season: "Fall 2025",
    image: "/cocktails/old-fashioned-v2.png",
    ingredients: [
      { name: "Bourbon or Rye", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Simple Syrup", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Angostura Bitters", amount: "3", unit: "dash", orderUnit: "4oz bottles" },
      { name: "Lemon Twist", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 103,
    name: "Pear & Ginger Moscow Mule",
    method: "Shake",
    instructions: "1. Combine vodka, pear puree, lime juice, and cardamom with ice.\n2. Shake well.\n3. Strain into a glass with ice.\n4. Top with ginger beer and stir gently.\n5. Garnish with pear slice",
    abv: 16.2,
    glassType: "Highball",
    season: "Summer 2025",
    image: "/cocktails/pear-ginger-moscow-mule-v2.png",
    ingredients: [
      { name: "Vodka", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Pear Puree", amount: "2", unit: "oz", orderUnit: "quarts" },
      { name: "Lime Juice", amount: "0.5", unit: "oz", orderUnit: "gallons" },
      { name: "Ground Cardamom", amount: "0.25", unit: "tsp", orderUnit: "quarts" },
      { name: "Ginger Beer", amount: "0.4", unit: "oz", orderUnit: "12oz cans" },
      { name: "Pear slice", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 104,
    name: "Pear and Cranberry Bellini",
    method: "Build",
    instructions: "1. Combine pear nectar and cranberry juice (unsweetened works best) into a chilled champagne flute.\n2. Top with cold Prosecco or your favorite sparkling wine, pouring slowly to manage the fizz.",
    abv: 7.4,
    glassType: "Flute",
    season: "Fall 2025",
    image: "/cocktails/pear-cranberry-bellini.png",
    ingredients: [
      { name: "Sparkling wine", amount: "4", unit: "oz", orderUnit: "liters" },
      { name: "White Cramberry", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Pear  Nectar", amount: "1.5", unit: "oz", orderUnit: "quarts" }
    ],
  },

  {
    id: 105,
    name: "Pear Bourbon Sour",
    method: "Shake",
    instructions: "1. Combine 2 oz bourbon with 2 oz pear nectar/juice, lemon juice, and simple syrup in a shaker.\n2. Add ice to the shaker and shake vigorously for 10-15 seconds until very cold.\n3. Strain into a rocks glass filled with fresh ice.\n4. Garnish with pear and dry cherry skewer.\n5. dont forget the pear slice",
    abv: 25.3,
    glassType: "Rocks",
    season: "Fall 2025",
    image: "/cocktails/pear-bourbon-sour.png",
    ingredients: [
      { name: "Bourbon", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Pear Liqueur", amount: "1", unit: "oz", orderUnit: "liters" },
      { name: "Simple syrup", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Lemon Juice", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Angostura Bitters", amount: "2", unit: "dash", orderUnit: "4oz bottle" },
      { name: "Pear Slice", amount: "1", unit: "each", orderUnit: "each" },
      { name: "Dry Cherry", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 106,
    name: "Peruvian Garden Spritz",
    method: "Build",
    instructions: "1. Muddle Cucumber Slices and Mint Leaves.\n2. Add Pisco and Lime Juice to Infuse.\n3. Fill Glass with Ice and Strain Mixture.\n4. Top with Sparkling Wine and Soda Water.\n5. Stir gently.",
    abv: 14,
    glassType: "Served Up",
    season: "Summer 2025",
    image: "/cocktails/peruvian-garden-spritz.png",
    ingredients: [
      { name: "Pisco", amount: "1.5", unit: "oz", orderUnit: "liters" },
      { name: "Lime Juice", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Sparkling Wine", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Soda Water", amount: "2", unit: "oz", orderUnit: "12oz cans" },
      { name: "Thin Cucumber Slices", amount: "1", unit: "each", orderUnit: "each" },
      { name: "Mint Leaves", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 107,
    name: "Rose Garden",
    method: "Build",
    instructions: "1. Combine vodka, lemon juice, cardamon simple syrup and rose hydrolat in cocktail glass.\n2. Add grapefruit seltzer and garnish.\n3. Garnish with single baby pansy in the middle.",
    featured: true,
    abv: 10.7,
    glassType: "Served Up",
    season: "Spring 2025",
    image: "/cocktails/rose-garden-v4.png",
    ingredients: [
      { name: "Vodka", amount: "1.5", unit: "oz", orderUnit: "liters" },
      { name: "Lemon Juice", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Cardamon Simple Syrup", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Spindrift GrapeFruit Seltzer", amount: "3", unit: "oz", orderUnit: "12oz can" },
      { name: "Rose Hydrolat", amount: "3", unit: "dash", orderUnit: "4oz bottle" },
      { name: "Baby Pansy", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 108,
    name: "Ruby Red Anniversary Daiquiri",
    method: "Shake",
    instructions: "1. Combine all ingredients in a shaker with ice.\n2. Shake vigorously until chilled.\n3. Double-strain into a coupe glass.",
    abv: 20.7,
    glassType: "Coupe",
    season: "Summer 2025",
    image: "/cocktails/ruby-red-anniversary-daiquiri.png",
    ingredients: [
      { name: "White Rum", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Fresh Ruby Red Grapefruit Juice", amount: "1", unit: "oz", orderUnit: "gallons" },
      { name: "Fresh Lime Juice", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Simple Syrup", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Maraschino Liqueur (Optional)", amount: "0.25", unit: "oz", orderUnit: "liters" }
    ],
  },

  {
    id: 109,
    name: "Sage and Ginger Paloma",
    method: "Build",
    instructions: "1. Lightly crush 2–3 sage leaves in your shaker with a splash of lime juice.\n2. Add Tequila and Grapefruit juice with ice.\n3. Shake briefly to chill.\n4. Strain into a glass with fresh ice and top with Ginger Beer.\n5. Garnish with grapefruit slice and a sage leaf.",
    abv: 10.7,
    glassType: "Highball",
    season: "Fall 2025",
    image: "/cocktails/sage-and-ginger-paloma.png",
    ingredients: [
      { name: "Tequila (Reposado)", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Sage Infused Honey", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Grapefruit Juice", amount: "2", unit: "oz", orderUnit: "quarts" },
      { name: "Lime Juice", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Ginger Beer", amount: "2", unit: "oz", orderUnit: "12oz can" },
      { name: "Sage Leaf", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 110,
    name: "Sangue Di Bergamotto Mocktail",
    method: "Shake",
    instructions: "1. Combine hibiscus tea, ginger syrup, and bergamot puree into a cocktail glass with ice.\n2. Shake well until chilled.",
    abv: 0,
    glassType: "Rocks",
    season: "Spring 2026",
    image: "/cocktails/sangue-di-bergamotto-mocktail.png",
    ingredients: [
      { name: "Hibiscus Tea", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Ginger syrup", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Bergamot puree", amount: "1", unit: "oz", orderUnit: "quarts" }
    ],
  },

  {
    id: 111,
    name: "Sparkling Pear French 75",
    method: "Build",
    instructions: "1. Combine gin, pear brandy (or Pear Nectar), and lemon juice into a shaker with ice.\n2. Shake for 10 seconds until cold.\n3. Pour into a chilled champagne flute.\n4. Top off with champagne or prosecco.\n5. Garnish with a thin pear slice or a lemon twist.",
    abv: 13.8,
    glassType: "Flute",
    season: "Spring 2025",
    image: "/cocktails/sparkling-pear-french-75.png",
    ingredients: [
      { name: "Gin", amount: "1", unit: "oz", orderUnit: "liters" },
      { name: "Lemon Juice", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Peary Syrup", amount: "1", unit: "oz", orderUnit: "quarts" },
      { name: "Champagne", amount: "3", unit: "oz", orderUnit: "liters" },
      { name: "Lemos Peel", amount: "1", unit: "each", orderUnit: "each" }
    ],
  },

  {
    id: 112,
    name: "Whiskey Honey Lemonade",
    method: "Build",
    instructions: "1. Combine whiskey (Bourbon works best),  lemon juice, and honey syrup (equal parts honey/water) into cocktail glass with ice.\n2. Add a splash of Soda water if you want it bubbly (optional).\n3. Garnish with a lemon wheel or a sprig of mint.",
    abv: 12.3,
    glassType: "Rocks",
    season: "Summer 2025",
    image: "/cocktails/whiskey-honey-lemonade.png",
    ingredients: [
      { name: "Bourbon", amount: "2", unit: "oz", orderUnit: "liters" },
      { name: "Lemonade", amount: "4", unit: "oz", orderUnit: "gallons" },
      { name: "Honey-Lavender Syrup", amount: "0.5", unit: "oz", orderUnit: "quarts" },
      { name: "Mint Sprigs", amount: "3.5", unit: "each", orderUnit: "each" },
      { name: "Baby Pansy", amount: "1", unit: "each", orderUnit: "each" }
    ],
  }
]
