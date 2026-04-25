import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from 'antd';
import ListPage from './pages/ListPage';
import EditPage from './pages/EditPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, RequireAuth, useAuth } from './pages/auth';



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<RequireAuth />} >
            <Route
              path="/list"
              element={
                <ListPage />
              }
            />
            <Route
              path="/edit/:id"
              element={
                <EditPage />
              }
            />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
