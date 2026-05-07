import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'es' | 'en';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  es: {
    appTitle: 'Gestor de Proyectos',
    welcome: 'Bienvenido a PS',
    subtitle: 'Gestor de Proyectos Profesional. Colaborativo, intuitivo y adaptado para equipos ágiles.',
    tryDemo: 'Probar Demo Kanban',
    backendWarning: 'Asegúrate de que el Backend esté corriendo en puerto 4000 para sincronización en tiempo real.',
    viewDemo: 'Ver Tablero Demo',
    backHome: 'Volver al Inicio',
    loading: 'Cargando tablero...',
    addList: 'Agregar Lista',
    listNamePlaceholder: 'Nombre de la lista...',
    add: 'Agregar',
    addCard: 'Agregar tarjeta',
    cardTitlePlaceholder: 'Título de la tarjeta...',
    save: 'Guardar',
    taskTitle: 'Título de la tarea',
    assignTo: 'Asignar a',
    unassigned: 'Sin asignar',
    description: 'Descripción',
    descriptionPlaceholder: 'Añade una descripción más detallada...',
    cancel: 'Cancelar',
    saveChanges: 'Guardar cambios',
    mockBoardName: 'Proyecto Demo',
    mockOfflineName: 'Proyecto Demo (Offline)',
    mockCheckServer: 'Revisar conexión al servidor',
    todo: 'Por Hacer',
    inProgress: 'En Progreso',
    done: 'Hecho',
    mockCard1: 'Planificar arquitectura base de datos',
    mockCard2: 'Configurar variables de entorno',
    mockCard3: 'Implementar drag & drop de columnas',
    mockCard4: 'Modo oscuro',
    errorCard: 'Hubo un error al guardar la tarjeta en el servidor.',
    errorList: 'Hubo un error al guardar la lista en el servidor.',
  },
  en: {
    appTitle: 'Project Manager',
    welcome: 'Welcome to PS',
    subtitle: 'Professional Project Manager. Collaborative, intuitive, and tailored for agile teams.',
    tryDemo: 'Try Kanban Demo',
    backendWarning: 'Make sure the Backend is running on port 4000 for real-time synchronization.',
    viewDemo: 'View Demo Board',
    backHome: 'Back to Home',
    loading: 'Loading board...',
    addList: 'Add List',
    listNamePlaceholder: 'List name...',
    add: 'Add',
    addCard: 'Add card',
    cardTitlePlaceholder: 'Card title...',
    save: 'Save',
    taskTitle: 'Task title',
    assignTo: 'Assign to',
    unassigned: 'Unassigned',
    description: 'Description',
    descriptionPlaceholder: 'Add a more detailed description...',
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    mockBoardName: 'Demo Project',
    mockOfflineName: 'Demo Project (Offline)',
    mockCheckServer: 'Check server connection',
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',
    mockCard1: 'Plan database architecture',
    mockCard2: 'Configure environment variables',
    mockCard3: 'Implement column drag & drop',
    mockCard4: 'Dark mode',
    errorCard: 'There was an error saving the card to the server.',
    errorList: 'There was an error saving the list to the server.',
  },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['es']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key: keyof typeof translations['es']): string => {
    return translations[language][key as string] || key as string;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
};