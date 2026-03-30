import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// Default: Nagpur, India
const DEFAULT = { lat: 21.1458, lng: 79.0882 };

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported');
      setLocation(DEFAULT);
      toast.error('Geolocation not supported — using default location');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
        setLocLoading(false);
      },
      (err) => {
        console.warn('Location denied, using default:', err.message);
        setLocation(DEFAULT);
        setLocError(err.message);
        setLocLoading(false);
        toast('Using default location. Enable location for real SOS.', { icon: '📍' });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  return { location, locError, locLoading, getLocation };
};
