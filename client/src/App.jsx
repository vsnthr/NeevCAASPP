import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import ProgressPage from './pages/ProgressPage';
import ReviewPage from './pages/ReviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div style={{ paddingTop: 60 }}>
        <Routes>
          <Route path="/"         element={<HomePage />}    />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/review"   element={<ReviewPage />}   />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
