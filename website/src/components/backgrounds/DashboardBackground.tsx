import React from 'react';
import { InfrastructureCityBackground } from './InfrastructureCityBackground';

/**
 * Re-exporting unified InfrastructureCityBackground as DashboardBackground
 * for seamless backward compatibility across the application.
 */
export const DashboardBackground: React.FC = () => {
  return <InfrastructureCityBackground />;
};

export default DashboardBackground;
