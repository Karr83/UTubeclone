// useRefresh - Pull-to-refresh functionality
import { useState, useCallback } from 'react';

const useRefresh = (refreshFunction) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshFunction();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFunction]);

  return {
    isRefreshing,
    onRefresh,
  };
};

export default useRefresh;

