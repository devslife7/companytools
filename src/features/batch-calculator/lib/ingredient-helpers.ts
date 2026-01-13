// Helper function to identify liquor items
export const isLiquorItem = (name: string): boolean => {
  const liquorKeywords = [
    "vodka", "gin", "rum", "whiskey", "whisky", "bourbon", "tequila", "pisco",
    "brandy", "cognac", "liqueur", "liquor", "prosecco", "champagne", "wine",
    "sparkling wine", "sake", "mezcal", "rye", "scotch", "vermouth", "curacao",
    "kahlua", "maraschino", "cognac", "armagnac", "port", "sherry", "aperol",
    "campari", "chartreuse", "benedictine", "drambuie", "frangelico", "baileys",
    "amaretto", "cointreau", "triple sec", "grand marnier", "chambord", "st germain", "angostura bitters"
  ]
  const lowerName = name.toLowerCase()
  return liquorKeywords.some(keyword => lowerName.includes(keyword))
}

// Helper function to identify soda items
export const isSodaItem = (name: string): boolean => {
  const sodaKeywords = [
    "ginger beer", "ginger ale", "soda water", "club soda", "tonic water", "tonic",
    "seltzer", "sparkling water", "carbonated water", "cola", "sprite", "7up",
    "fresca", "fanta", "root beer", "dr pepper", "mountain dew", "pepsi", "coca cola"
  ]
  const lowerName = name.toLowerCase()
  return sodaKeywords.some(keyword => lowerName.includes(keyword))
}

// Helper function to check if item is ginger beer
export const isGingerBeer = (name: string): boolean => {
  return name.toLowerCase().includes("ginger beer")
}

// Helper function to check if item is Angostura bitters
export const isAngosturaBitters = (name: string): boolean => {
  return name.toLowerCase().includes("angostura bitters")
}
