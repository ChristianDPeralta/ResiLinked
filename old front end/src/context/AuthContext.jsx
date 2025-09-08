import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

export { AuthContext }

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('savedEmail')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')
    
    if (!token || !userData) {
      clearAuthData()
      return false
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const responseData = await response.json()
        const parsedUserData = JSON.parse(userData)
        
        // Update user data with fresh info if available
        const updatedUserData = {
          userId: parsedUserData.userId || responseData.user?.id || responseData.user?._id,
          userType: parsedUserData.userType || responseData.user?.userType,
          isVerified: parsedUserData.isVerified || responseData.user?.isVerified,
          firstName: parsedUserData.firstName || responseData.user?.firstName,
          lastName: parsedUserData.lastName || responseData.user?.lastName
        }
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData))
        setUser(updatedUserData)
        setIsAuthenticated(true)
        return true
      } else {
        console.log('Token verification failed')
        clearAuthData()
        return false
      }
    } catch (error) {
      console.error('Token verification error:', error)
      // Don't clear auth data on network errors
      return null
    }
  }, [clearAuthData])

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('userData')
      
      console.log('AuthContext initialization:', { token: !!token, userData })
      
      if (token && userData) {
        try {
          const parsedUserData = JSON.parse(userData)
          console.log('Parsed user data:', parsedUserData)
          setUser(parsedUserData)
          setIsAuthenticated(true)
          console.log('✅ Authentication state set to true')
          
          // Verify token in background
          verifyToken()
        } catch (error) {
          console.error('Error parsing user data:', error)
          clearAuthData()
        }
      } else {
        console.log('No token or userData found in localStorage')
      }
      
      setLoading(false)
    }

    initAuth()

    // Set up periodic token verification
    const interval = setInterval(() => {
      if (isAuthenticated) {
        verifyToken()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, verifyToken, clearAuthData])

  const login = (token, userData) => {
    console.log('Login called with:', { token: !!token, userData })
    localStorage.setItem('token', token)
    localStorage.setItem('userData', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
    console.log('Login completed, auth state:', { isAuthenticated: true, user: userData })
  }

  const logout = useCallback(() => {
    clearAuthData()
  }, [clearAuthData])

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData }
    localStorage.setItem('userData', JSON.stringify(newUserData))
    setUser(newUserData)
  }

  // Check if user has access to specific dashboard types
  const hasAccessTo = useCallback((dashboardType) => {
    console.log('hasAccessTo check:', {
      dashboardType,
      isAuthenticated,
      user,
      userType: user?.userType
    })
    
    if (!isAuthenticated || !user) {
      console.log('Access denied: not authenticated or no user data')
      return false
    }
    
    switch (dashboardType) {
      case 'employee':
        const hasEmployeeAccess = user.userType === 'employee' || user.userType === 'both'
        console.log('Employee access check:', hasEmployeeAccess)
        return hasEmployeeAccess
      case 'employer':
        const hasEmployerAccess = user.userType === 'employer' || user.userType === 'both'
        console.log('Employer access check:', hasEmployerAccess)
        return hasEmployerAccess
      case 'admin':
        const hasAdminAccess = user.userType === 'admin'
        console.log('Admin access check:', hasAdminAccess)
        return hasAdminAccess
      default:
        console.log('Unknown dashboard type:', dashboardType)
        return false
    }
  }, [isAuthenticated, user])

  const value = {
    user,
    isAuthenticated,
    isLoggedIn: isAuthenticated, // Alias for backward compatibility
    loading,
    login,
    logout,
    updateUser,
    verifyToken,
    hasAccessTo,
    clearAuthData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
