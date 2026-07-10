import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/marketing_ui/input';
import { ScrollArea } from '@/components/marketing_ui/scroll-area';
import { searchGifs, type GifResult } from '../services/chatApi';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Debounce search
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGifsData = useCallback(async (searchQuery: string, currentOffset: number, append: boolean = false) => {
    if (!hasMore && append) return;
    
    setIsLoading(true);
    try {
      const data = await searchGifs(searchQuery, currentOffset, 20);
      
      if (append) {
        setGifs(prev => [...prev, ...data.results]);
      } else {
        setGifs(data.results);
      }
      
      setHasMore(data.pagination.count === 20); // If we got 20, there might be more
    } catch (error) {
      console.error('Failed to fetch GIFs', error);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore]);

  // Initial load (trending)
  useEffect(() => {
    fetchGifsData('', 0, false);
  }, [fetchGifsData]);

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOffset(0);
    setHasMore(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      fetchGifsData(val, 0, false);
    }, 500);
  };

  // Handle scroll to bottom for pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (!isLoading && hasMore) {
        const nextOffset = offset + 20;
        setOffset(nextOffset);
        fetchGifsData(query, nextOffset, true);
      }
    }
  };

  return (
    <div className="w-[300px] h-[400px] flex flex-col bg-background border rounded-lg shadow-md overflow-hidden">
      <div className="p-2 border-b flex items-center relative">
        <Search className="w-4 h-4 absolute left-4 text-muted-foreground" />
        <Input 
          value={query}
          onChange={handleSearchChange}
          placeholder="Search Tenor (GIPHY)..."
          className="pl-8 h-9 text-sm w-full bg-secondary/50 border-none focus-visible:ring-1"
        />
      </div>
      
      <ScrollArea 
        className="flex-1 p-2" 
        onScrollCapture={handleScroll}
      >
        {gifs.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No GIFs found
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {gifs.map((gif, index) => (
            <div 
              key={`${gif.id}-${index}`} 
              className="relative cursor-pointer rounded-md overflow-hidden group bg-secondary/50 aspect-square flex items-center justify-center"
              onClick={() => onSelect(gif.url)}
            >
              <img 
                src={gif.preview_url} 
                alt={gif.title || 'GIF'} 
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </ScrollArea>
      
      <div className="text-[10px] text-center py-1 text-muted-foreground border-t bg-secondary/30">
        Powered by GIPHY
      </div>
    </div>
  );
}
