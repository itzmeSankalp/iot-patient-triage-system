import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from "firebase/auth"; // Import signInAnonymously
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- NEW --- Function to handle guest login
  const handleGuestLogin = async () => {
    setError('');
    try {
      await signInAnonymously(auth);
      // Navigate to the selected role's dashboard as a guest
      navigate(role === 'doctor' ? '/doctor' : '/receptionist');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate(role === 'doctor' ? '/doctor' : '/receptionist');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: role
        });
        navigate(role === 'doctor' ? '/doctor' : '/receptionist');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <div className="role-selector">
          <button onClick={() => setRole('doctor')} className={role === 'doctor' ? 'active' : ''}>Doctor</button>
          <button onClick={() => setRole('receptionist')} className={role === 'receptionist' ? 'active' : ''}>Receptionist</button>
        </div>

        {/* --- NEW --- Guest Login Button */}
        <button onClick={handleGuestLogin} className="guest-button">
          Sign in as Guest {role === 'doctor' ? 'Doctor' : 'Receptionist'}
        </button>
        <div className="divider">OR</div>

        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="auth-button">{isLogin ? 'Login' : 'Create Account'}</button>
        </form>
        <p className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;