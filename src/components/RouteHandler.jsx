import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RouteHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    
    if (path.includes('/multiplayer/')) {
      const roomId = path.split('/multiplayer/')[1];
      const username = params.get('username') || 'Guest';
      navigate(`/multiplayer/${roomId}?username=${username}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default RouteHandler;