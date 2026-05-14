import React from "react";
import { useRoute, Link } from "wouter";
import { listings } from "@/data/listings";
import { ArrowLeft, MapPin, Clock, BadgeCheck, MessageCircle, Share, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const id = params?.id ? parseInt(params.id, 10) : null;
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Listing not found</h2>
        <p className="text-muted-foreground mb-6">The item you're looking for may have been sold or removed.</p>
        <Link href="/">
          <Button className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to listings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 md:py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12">
          
          {/* Left Column: Image & Details */}
          <div className="space-y-8">
            <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted border border-border shadow-sm">
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary rounded-full px-3 py-1 text-sm border-0">
                  {listing.category}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Listed {listing.postedDate}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
                {listing.title}
              </h1>
              
              <div className="text-3xl font-bold text-foreground mb-6">
                ${listing.price}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Description</h2>
                <div className="prose prose-sm sm:prose-base dark:prose-invert text-muted-foreground leading-relaxed">
                  <p>{listing.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Seller Info & Actions */}
          <div>
            <div className="sticky top-20 space-y-6">
              
              {/* Action Card */}
              <Card className="shadow-sm border-border">
                <CardContent className="p-6">
                  <Button className="w-full h-12 text-base font-semibold shadow-sm mb-3 group relative overflow-hidden rounded-xl">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact Seller
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mb-6">
                    Typically responds within an hour
                  </p>
                  
                  <Separator className="mb-6" />
                  
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Pick up in {listing.location}</p>
                      <p className="text-muted-foreground">Approximate location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Card */}
              <Card className="shadow-sm border-border bg-card/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">About the Seller</h3>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0 border border-primary/20">
                      {listing.sellerName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="font-semibold text-lg leading-none">{listing.sellerName}</p>
                        {listing.isVerifiedSeller && (
                          <BadgeCheck className="h-5 w-5 text-teal-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm font-medium text-foreground">{listing.sellerRating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">• (12 reviews)</span>
                      </div>
                      
                      {listing.isVerifiedSeller && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-1 rounded-md border border-teal-100 dark:border-teal-900/50">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified Member
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Tip */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30 text-sm text-amber-800 dark:text-amber-200/80 flex gap-3 items-start">
                <div className="shrink-0 mt-0.5">
                  <BadgeCheck className="h-5 w-5 opacity-70" />
                </div>
                <p>
                  <strong>Safety tip:</strong> Always meet in a well-lit, public place. Never wire money before seeing the item in person.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
