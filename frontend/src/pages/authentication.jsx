import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../context/AuthContext";
import { colors, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const defaultTheme = createTheme();

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0: Login, 1: Register
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  

  
    const navigate = useNavigate();
  
    const handleBack = () => {
      navigate("/"); // Navigates to the home page
    }

  // Clear username and password when the page loads (to avoid browser autofill issues)
  React.useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

  
  const handleAuth = async () => {
    
    try {
      if (formState === 0) {
        const result = await handleLogin(username, password);
        // You can handle any post-login logic here

        
    if (result.success) {
        // ✅ Login successful
        console.log("Login successful:", result);
        // You can redirect, update state, or switch forms here
        setFormState(1); // for example, go to the next step
      } else {
        // ⚠️ Login failed - show an error message
        console.error("Login failed:", result.message);
        setError(result.message || "Login failed");
      }
    
      }

      if (formState === 1) {
        const result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0); // Switch to login after successful registration
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || "An error occurred. Please try again.";
      setError(errorMessage);
    }
  };


  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: "100vh" }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d")',
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center",
            
          }}
        />


        <Grid 
        item 
        xs={12} 
        sm={8} 
        md={5} 
        component={Paper}
         elevation={6} 
         square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>

            <div>
              <Button
                variant={formState === 0 ? "contained" : ""}
                onClick={() => setFormState(0)}
              >
                Sign In
              </Button>
              <Button
                variant={formState === 1 ? "contained" : ""}
                onClick={() => setFormState(1)}
              >
                Sign Up
              </Button>
            </div>

            <Box component="form" noValidate sx={{ mt: 1 }}>
              {formState === 1 && (
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="full-name"
                  label="Full Name"
                  name="full-name"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="new-password" // Disable autofill
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="new-password" // Disable autofill
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                autoComplete="new-password" // Disable autofill
              />

              {error && <p style={{ color: "red" }}>{error}</p>}

              

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"}
              </Button>
              <Button style={{color:"white", backgroundColor:"blue"}}
              onClick={handleBack}
              >Back</Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </ThemeProvider>
  );
}