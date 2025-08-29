// Centralized Axios client lives in `src/config/api.ts`.
// Re-export it here for backward compatibility and default export.
import { apiClient } from '@/config/api';

export { apiClient };
export default apiClient;
