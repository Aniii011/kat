import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { listings } from "@/data/listings";
import { Search, MapPin, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["All", "Electronics", "Clothing", "Furniture", "Books", "Sports", "Vehicles", "Other"];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <MapPin className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">NearBuy</span>
          </Link>
          
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search local listings..."
              className="w-full pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            <Button className="rounded-full font-medium">Post Item</Button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search local listings..."
              className="w-full pl-9 bg-muted/50 border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Hero Section */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Find it locally.</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Discover unique items from people right in your neighborhood. Skip the shipping, meet the community.
          </p>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground border border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`} className="group block h-full">
                <Card className="h-full overflow-hidden border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-card">
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-card/90 font-medium">
                        {listing.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex flex-col h-[calc(100%-75%)]">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <span className="font-bold text-lg text-foreground shrink-0">${listing.price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
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
