import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Cache the Tidio key to avoid unnecessary database calls
let cachedTidioKey: string | null = null;
let isLoading = false;

export const ChatWidget = () => {
  const [tidioPublicKey, setTidioPublicKey] = useState<string>(cachedTidioKey || '');

  useEffect(() => {
    // If already cached, use it
    if (cachedTidioKey) {
      setTidioPublicKey(cachedTidioKey);
      return;
    }

    // If already loading, don't load again
    if (isLoading) return;

    const fetchTidioKey = async () => {
      isLoading = true;
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('tidio_public_key')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching tidio key:', error);
          return;
        }

        if (data?.tidio_public_key) {
          cachedTidioKey = data.tidio_public_key;
          setTidioPublicKey(data.tidio_public_key);
        }
      } catch (error) {
        console.error('Error loading tidio widget:', error);
      } finally {
        isLoading = false;
      }
    };

    fetchTidioKey();
  }, []);

  useEffect(() => {
    if (!tidioPublicKey) return;

    // Build Tidio script URL from public key
    const scriptSrc = `//code.tidio.co/${tidioPublicKey}.js`;
    
    // Check if script already exists in the entire document
    const existingScript = document.querySelector(`script[src="${scriptSrc}"], script[src*="code.tidio.co"]`);
    if (existingScript) return;

    // Create and inject the script only once
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Don't remove the script on unmount to keep it loaded across page navigations
  }, [tidioPublicKey]);

  return null;
};
