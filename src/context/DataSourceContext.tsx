import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export type DataSource = 'local' | 'online';

interface DataSourceContextType {
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  toggleDataSource: () => void;
  isLocal: boolean;
  isOnline: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

interface DataSourceProviderProps {
  children: ReactNode;
  initialValue?: DataSource;
}

export const DataSourceProvider: React.FC<DataSourceProviderProps> = ({
  children,
  initialValue = 'local',
}) => {
  const [dataSource, setDataSourceState] = useState<DataSource>(initialValue);

  const setDataSource = useCallback((source: DataSource) => {
    setDataSourceState(source);
  }, []);

  const toggleDataSource = useCallback(() => {
    setDataSourceState((prev) => (prev === 'local' ? 'online' : 'local'));
  }, []);

  const value: DataSourceContextType = {
    dataSource,
    setDataSource,
    toggleDataSource,
    isLocal: dataSource === 'local',
    isOnline: dataSource === 'online',
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = (): DataSourceContextType => {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
};