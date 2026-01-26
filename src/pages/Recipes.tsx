import { Search, Clock, Users, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import recipeSalmon from "@/assets/recipe-salmon.jpg";
import recipeSoup from "@/assets/recipe-soup.jpg";
import recipeChicken from "@/assets/recipe-chicken.jpg";

const recipes = [
  {
    id: "1",
    title: "Laxsallad med quinoa",
    time: "25 min",
    servings: 2,
    tags: ["Protein", "Omega-3"],
    image: recipeSalmon,
  },
  {
    id: "2",
    title: "Vegansk linssoppa",
    time: "40 min",
    servings: 4,
    tags: ["Vegansk", "Fiber"],
    image: recipeSoup,
  },
  {
    id: "3",
    title: "Kyckling med rostad sötpotatis",
    time: "35 min",
    servings: 2,
    tags: ["Protein", "Lågt GI"],
    image: recipeChicken,
  },
];

const categories = ["Alla", "Frukost", "Lunch", "Middag", "Mellanmål"];

export default function Recipes() {
  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Recept</h1>
        <p className="text-sm text-muted-foreground">Hitta recept som passar dig</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Sök recept..." className="pl-10" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((cat, index) => (
          <Badge
            key={cat}
            variant={index === 0 ? "default" : "secondary"}
            className="rounded-full px-4 py-1.5 whitespace-nowrap cursor-pointer"
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Recipe Grid */}
      <div className="space-y-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="shadow-soft overflow-hidden cursor-pointer hover:shadow-elevated transition-shadow">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 h-24 bg-muted flex-shrink-0">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {recipe.title}
                    </h3>
                    <button className="text-muted-foreground hover:text-accent transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {recipe.servings} port
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
