import type { CocktailRecipe } from "../types"

export const COCKTAIL_DATA: CocktailRecipe[] = [
  {
    name: "Autumn Bloom Mocktail",
    garnish: "Mint sprig and Lavender sprig",
    method:
      "Add all ingredients (except cider) to a shaker with ice. Shake briefly to chill. Strain into a glass with fresh ice. Top with sparkling cider and stir gently.",
    ingredients: [
      { name: "Sparkling Apple Cider", amount: "3 oz" },
      { name: "Pear Nectar/Juice", amount: "1 oz" },
      { name: "Orange Juice", amount: "1 oz" },
      { name: "Cinnamon Syrup", amount: "0.75 oz" },
    ],
  },
  {
    name: "Blackberry Collins",
    garnish: "Blackberry Wrapped in Mint Leaf on a Skewer",
    method:
      "1. Combine vodka, lemon juice, simple syrup, and blackberry puree into a cocktail shaker filled with ice. 2. Shake until ingredients are properly chilled and strain into a collins glass filled with ice. 3. Top off with ginger beer. 4. Add edible gold dust.",
    ingredients: [
      { name: "Vodka", amount: "1.5 oz" },
      { name: "Lemon Juice", amount: "0.75 oz" },
      { name: "Simple Syrup", amount: "0.75 oz" },
      { name: "Blackberry Puree", amount: "0.5 oz" },
      { name: "Ginger Beer", amount: "3 oz" },
    ],
  },
  {
    name: "Blue and Yellow Mimosa",
    garnish: "Mint sprig and Lavender sprig",
    method: "Pour blue coracao last",
    ingredients: [
      { name: "Prosecco", amount: "2 oz" },
      { name: "Orange Juice", amount: "2 oz" },
      { name: "Blue Curacao", amount: "0.25 oz" },
    ],
  },
  {
    name: "Classic Pisco Sour",
    garnish: "Angostura Bitters (3-5 drops)",
    method:
      "1. Add Pisco, Lime Juice, Simple Syrup, and Egg White to a shaker and dry-shake (without ice) vigorously. 2. Add ice and shake again until well-chilled. 3. Strain into a chilled glass (Timeless Cocktail). 4. Garnish with Angostura bitters drops.",
    ingredients: [
      { name: "Pisco", amount: "2 oz" },
      { name: "Lime Juice", amount: "1 oz" },
      { name: "Simple Syrup", amount: "0.75 oz" },
      { name: "Egg White", amount: "1" },
    ],
  },
  {
    name: "Espresso Martini",
    garnish: "3 coffee beans",
    method: "Shaken",
    ingredients: [
      { name: "Vodka", amount: "2 oz" },
      { name: "Espresso", amount: "1 oz" },
      { name: "Kahlua (Coffee Liqueur)", amount: "0.5 oz" },
      { name: "Simple syrup", amount: "0.25 oz" },
    ],
  },
  {
    name: "Old Fashioned",
    garnish: "Lemon Twist",
    method:
      "1. Combine all ingredients in a tin filled with ice. 2. Stir until well-chilled. 3. Strain into a rocks glass filled with fresh ice.",
    ingredients: [
      { name: "Bourbon or Rye", amount: "2 oz" },
      { name: "Simple Syrup", amount: "0.5 oz" },
      { name: "Angostura Bitters", amount: "3 Dashes" },
    ],
  },
  {
    name: "Pear & Ginger Moscow Mule",
    garnish: "Pear Slice",
    method:
      "1. Combine vodka, pear puree, lime juice, and cardamom with ice. 2. Shake well. 3. Strain into a glass with ice. 4. Top with ginger beer and stir gently.",
    ingredients: [
      { name: "Vodka", amount: "2 oz" },
      { name: "Pear Puree", amount: "2 oz" },
      { name: "Lime Juice", amount: "0.5 oz" },
      { name: "Ground Cardamom", amount: "0.25 tsp" },
      { name: "Ginger Beer", amount: "0.4 oz" },
    ],
  },
  {
    name: "Peruvian Garden Spritz",
    garnish: "Cucumber Ribbon & Mint Sprig",
    method:
      "1. Muddle Cucumber Slices and Mint Leaves. 2. Add Pisco and Lime Juice to Infuse. 3. Fill Glass with Ice and Strain Mixture. 4. Top with Sparkling Wine and Soda Water. 5. Stir gently.",
    ingredients: [
      { name: "Pisco", amount: "1.5 oz" },
      { name: "Lime Juice", amount: "0.5 oz" },
      { name: "Sparkling Wine", amount: "2 oz" },
      { name: "Soda Water", amount: "2 oz" },
      { name: "Thin Cucumber Slices", amount: "2" },
      { name: "Mint Leaves", amount: "5" },
    ],
  },
  {
    name: "Rhubarb Sour",
    garnish: "Mint sprig and Lavender sprig",
    method:
      "1. Dry Shake: Combine all ingredients (except ice) in a shaker and shake vigorously for 30 seconds. 2. Wet Shake: Add ice and shake again until chilled. Double-strain into a coupe or rocks glass.",
    ingredients: [
      { name: "Base Spirit (Whiskey or Gin)", amount: "2 oz" },
      { name: "Fresh Lemon Juice", amount: "1 oz" },
      { name: "Rhubarb Simple Syrup", amount: "1 oz" },
      { name: "Egg White (or Aquafaba)", amount: "1 large egg white (or 0.5 oz)" },
    ],
  },
  {
    name: "Rose Garden",
    garnish: "Edible Gold Dust (Added)",
    method: "Baby Pansy",
    ingredients: [
      { name: "Vodka", amount: "1.5 oz" },
      { name: "Lemon Juice", amount: "0.5 oz" },
      { name: "Cardamon Simple Syrup", amount: "0.5 oz" },
      { name: "Spindrift GrapeFruit Seltzer", amount: "3 oz" },
      { name: "Rose Hydrolat", amount: "3 dashes" },
    ],
  },
  {
    name: "Ruby Red Anniversary Daiquiri",
    garnish: "Mint sprig and Lavender sprig",
    method:
      "Combine all ingredients in a shaker with ice. Shake vigorously until chilled. Double-strain into a coupe glass.",
    ingredients: [
      { name: "White Rum", amount: "2 oz" },
      { name: "Fresh Ruby Red Grapefruit Juice", amount: "1 oz" },
      { name: "Fresh Lime Juice", amount: "0.5 oz" },
      { name: "Simple Syrup (1:1)", amount: "0.5 oz" },
      { name: "Maraschino Liqueur (Optional)", amount: "0.25 oz" },
    ],
  },
  {
    name: "Sage and Ginger Paloma",
    garnish: "Sage Leaf",
    method: "This cocktail is available on the bar all night.",
    ingredients: [
      { name: "Tequila (Reposado)", amount: "2 oz" },
      { name: "Sage Infused Honey", amount: "1 oz" },
      { name: "Grapefruit Juice", amount: "2 oz" },
      { name: "Lime Juice", amount: "0.5 oz" },
      { name: "Ginger Beer", amount: "Top" },
    ],
  },
  {
    name: "Sparkling Pear French 75",
    garnish: "Mint sprig and Lavender sprig",
    method: "Pour blue coracao last",
    ingredients: [
      { name: "Gin", amount: "1 oz" },
      { name: "Lemon Juice", amount: "0.5 oz" },
      { name: "Peary Syrup (del monte sliced pears can)", amount: "1 oz" },
      { name: "Champagne", amount: "3 oz" },
    ],
  },
  {
    name: "Whiskey Honey Lemonade",
    garnish: "Mint sprig and Lavender sprig",
    method: "Baby Pansy",
    ingredients: [
      { name: "Bourbon", amount: "2 oz" },
      { name: "Lemonade (Freshly Squeezed)", amount: "4 oz" },
      { name: "Honey-Lavender Syrup", amount: "0.5 oz" },
      { name: "Mint Sprigs", amount: "3-4 leaves" },
    ],
  },
  {
    name: "Maple Bourbon Cider",
    garnish: "Green Apple slice, cinnamon stick",
    method: "Shaken",
    ingredients: [
      { name: "Bourbon", amount: "2 oz" },
      { name: "Apple Cider", amount: "4 oz" },
      { name: "Lemon Juice", amount: "0.25 oz" },
      { name: "Maple Syrup", amount: "0.5 oz" },
    ],
  },
  {
    name: "Pear and Cranberry Bellini",
    garnish: "Pink sugar rim dont batch with sparkling wine",
    method: "build",
    ingredients: [
      { name: "Sparkling wine", amount: "4 oz" },
      { name: "White Cramberry", amount: "1 oz" },
      { name: "Pear  Nectar", amount: "1.5 oz" }
    ],
  }
]

