import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { listings } from "@/data/listings";
import { Search, MapPin, BadgeCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Furniture", "Electronics", "Sports", "Clothing", "Books", "Vehicles", "Other"];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        searchQuery === "" ||
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || listing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-xl text-primary">NearBuy</span>
          </Link>
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search listings…"
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 rounded-full">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Category pills */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <p className="text-sm text-muted-foreground mb-4">
          {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} found
          {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
          {searchQuery ? ` for "${searchQuery}"` : ""}
        </p>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredListings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`} className="group">
                <Card className="h-full overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-card/90 font-medium"
                      >
                        {listing.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <span className="font-bold text-base text-foreground shrink-0">${listing.price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="font-medium text-foreground">{listing.sellerName}</span>
                        {listing.isVerifiedSeller && (
                          <BadgeCheck className="h-4 w-4 text-teal-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-muted-foreground">{listing.postedDate}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground">
              We couldn't find anything matching your search. Try different keywords or select "All" categories.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NearBuy Marketplace. A demo for your neighborhood.</p>
        </div>
      </footer>
    </div>
  );
}
