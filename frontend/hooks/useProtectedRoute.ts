import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

type UserType = 'attorney' | 'juror' | 'admin';

export const useProtectedRoute = (requiredUserType: UserType) => {
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!token || !userType) {
      // Show professional toast message
      toast.error(
        'Please log in to access this portal',
        {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#F44336',
            color: '#fff',
            fontWeight: 500,
          },
        }
      );

      // Redirect to appropriate login page
      router.push(`/login/${requiredUserType}`);
      return;
    }

    // Verify user type matches required type
    if (userType !== requiredUserType) {
      toast.error(
        'You do not have permission to access this portal',
        {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#F44336',
            color: '#fff',
            fontWeight: 500,
          },
        }
      );

      // Redirect to appropriate login page
      router.push(`/login/${requiredUserType}`);
    }
  }, [router, requiredUserType]);
};