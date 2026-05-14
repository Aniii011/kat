4                      <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-card/90 font-medium">
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
                      <div className="text-xs text-muted-foreground mt-1">
  ⭐ 4.5 (120 reviews)
</div>
<div className="text-xs text-muted-foreground mt-1">
  ⭐ 4.5 (120 reviews)
</div> 
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
  <button className="mt-3 w-full bg-primary text-white rounded-md py-2 text-sm font-medium hover:opacity-90">
  Add to Cart
</button>
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
