import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await authService.login(formData);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Login response:', responseData);
        
        if (responseData.data && responseData.data.user) {
          login(responseData.data.user); // Use auth context login
          navigate('/home');
        } else {
          setError('Invalid response from server');
          console.error('Invalid response structure:', responseData);
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <Card className="w-full max-w-md border-none bg-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 text-center">{error}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                className="border-zinc-700 bg-zinc-800 text-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                className="border-zinc-700 bg-zinc-800 text-white"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Sign In
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-zinc-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/auth/signup')}
              className="text-purple-400 hover:text-purple-300"
            >
              Sign up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;