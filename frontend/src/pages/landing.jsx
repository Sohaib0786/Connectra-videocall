import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router=useNavigate();
  return (

    <div className="landingPageContainer">
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">Connectra</h2>
        <div className="navLinks">
          <p className="navItem" onClick={()=>{
            router("/qscfb");
          }}>Join as Guest</p>
          <p className="navItem" onClick={()=>{
            router("/auth");
          }}>Register</p>
          <div className="navButton" onClick={()=>{
            router("/auth");
          }}>Login</div>
        </div>
      </nav>





      {/* Hero Section */}
      <div className="heroSection">
        <div className="heroText">
          <h1 >
            <span className="highlight">Connect</span> with your loved ones
          </h1>
          <p>Bridge the distance with seamless video calls using Connectra.</p>
          <Link to={"/auth"} className="ctaButton">
            Get Started
          </Link>
        </div>
        <div className="heroImage">
          <img src="/mobile.png" alt="Video Call Illustration" />
        </div>
      </div>
    </div>
  );
}