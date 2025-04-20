import { useState } from 'react'
import {Route,BrowserRouter as Router,Routes} from 'react-router-dom';
import LandingPage from './pages/landing';
import './App.css'
import Authentication from './pages/authentication';
import { AuthProvider } from './context/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/Home';
import History from './pages/history';
function App() {


  return (
    <>
      <div className='APP'>
        <Router>
          <AuthProvider>
          <Routes>
            <Route path='' element={<LandingPage/>}/>
            <Route path='/auth' element={<Authentication/>}/>
            <Route path='/home' element={<HomeComponent/>}/>
            <Route path='/history' element={<History/>}/>
            <Route path="/:url" element={<VideoMeetComponent/>}/>
          </Routes>
          </AuthProvider>
        </Router>

      </div>
    </>
  )
}

export default App