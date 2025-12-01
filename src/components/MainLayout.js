import React from 'react';
import NavigationBar from './NavigationBar';

const MainLayout = ({ children }) => {
    return (
        <div>
            <NavigationBar />
            <main>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
