export function installGlobalErrorHandler() {
  const originalHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();

  function logNavigationState() {
    try {
      console.warn('=== Navigation State at Error ===');
      console.warn('Stack trace:', new Error().stack);
      
      // Instead of trying to access navigation state directly,
      // we'll log the error context that will help debug the navigation issue
      console.warn('Error occurred in navigation. Check the following:');
      console.warn('1. Make sure you are using the navigation hook within a navigation context');
      console.warn('2. Verify that the screen you are navigating to is registered');
      console.warn('3. Check that all required navigation params are provided');
      
    } catch (e) {
      console.warn('Failed to log error state:', e);
      console.warn('Additional error details:', {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined
      });
    }
  }

  function globalHandler(error: any, isFatal?: boolean) {
    // Log detailed error information
    console.error('=== Detailed Error Information ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Stack trace:', error.stack);
    if (error.componentStack) {
      console.error('Component stack:', error.componentStack);
    }
    console.error('Is fatal:', isFatal);
    console.error('Error properties:', Object.keys(error));
    
    // Log navigation state for debugging
    logNavigationState();

    // Re-throw to the original handler if present
    if (originalHandler) {
      originalHandler(error, isFatal);
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  if (ErrorUtils && (ErrorUtils as any).setGlobalHandler) {
    (ErrorUtils as any).setGlobalHandler(globalHandler);
  }
}

export default installGlobalErrorHandler;
