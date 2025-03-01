import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SentenceList from './pages/SentenceList';
import SentenceForm from './pages/SentenceForm';
import Quiz from './pages/Quiz';
import Stats from './pages/Stats';

// Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/sentences" element={
            <ProtectedRoute>
              <SentenceList />
            </ProtectedRoute>
          } />
          <Route path="/sentences/new" element={
            <ProtectedRoute>
              <SentenceForm />
            </ProtectedRoute>
          } />
          <Route path="/sentences/edit/:id" element={
            <ProtectedRoute>
              <SentenceForm />
            </ProtectedRoute>
          } />
          <Route path="/quiz" element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          } />
          <Route path="/stats" element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
