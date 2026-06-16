import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/intelliumportal.png";
import logoSmall from "../../assets/images/intelliumlogo1.png";
export default ({ collapsed }) => {
  return (
    <div className="isoLogoWrapper">
      {collapsed ? (
        <div>
          <h3>
            <Link to="/dashboard">
              <img src={logoSmall} height="35" alt="logo"></img>
            </Link>
          </h3>
        </div>
      ) : (
        <h3>
          <Link to="/dashboard">
            <img src={logo} height="50" alt="logo"></img>
          </Link>
        </h3>
      )}
    </div>
  );
};
