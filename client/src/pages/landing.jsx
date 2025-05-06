import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Users, Brain, BarChart3, LogIn } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from "../components/ui/alert-dialog";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handlePlayClick = () => {
    setShowLoginPrompt(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Navigation Bar */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Chess Rating
          </div>
          <Button
            variant="outline"
            className="border-purple-500 bg-transparent text-purple-400 hover:bg-purple-950/30"
            onClick={() => navigate("/auth/login")}
          >
            <span className="flex items-center gap-2">
              Login <LogIn className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden py-12 md:py-24">
        <div className="absolute inset-0 z-0 opacity-5">
          <div className="chess-pattern h-full w-full"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg shadow-purple-500/20">
              <Trophy className="h-10 w-10" />
            </div>
            <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
              Advanced Chess Rating Analysis
            </h1>
            <p className="mt-6 max-w-3xl text-xl text-zinc-300">
              Play chess and get detailed insights into your performance with
              our advanced machine learning models and precise Elo & Glicko
              rating systems.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-gradient-to-r from-purple-600 to-blue-600 px-8 text-lg hover:from-purple-700 hover:to-blue-700 cursor-pointer"
                onClick={handlePlayClick}
              >
                <span className="flex items-center gap-2">
                  Start Playing <ChevronRight className="h-4 w-4" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-purple-500 bg-transparent px-8 text-lg text-purple-400 hover:bg-purple-950/30"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">
          How It Works
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Cards */}
          {[
            {
              icon: <Users className="h-6 w-6 text-white" />,
              title: "Play Chess",
              desc: "Challenge players from around the world and play chess matches in real-time. Every move contributes to your rating profile.",
              from: "from-blue-500",
              to: "to-blue-700",
            },
            {
              icon: <Brain className="h-6 w-6 text-white" />,
              title: "ML Analysis",
              desc: "Our machine learning models analyze your gameplay patterns, strengths, and weaknesses to provide personalized insights.",
              from: "from-pink-500",
              to: "to-purple-600",
            },
            {
              icon: <BarChart3 className="h-6 w-6 text-white" />,
              title: "Elo & Glicko",
              desc: "Get accurate ratings using both Elo and Glicko systems, providing a comprehensive view of your chess performance.",
              from: "from-amber-500",
              to: "to-orange-600",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="border-none bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 shadow-xl transition-all duration-300 hover:shadow-purple-500/10"
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${feature.from} ${feature.to} shadow-lg`}
                >
                  {feature.icon}
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-zinc-300">
                  {feature.desc}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Rating Explanation */}
      <section className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 py-12">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Advanced Rating Systems
            </h2>
            <p className="mt-4 text-zinc-300">
              Our platform combines the classic Elo rating system with the more
              modern Glicko system to provide the most accurate assessment of
              your chess skills.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                "Precise skill measurement across different time controls",
                "Rating confidence intervals to track improvement",
                "Machine learning predictions of future performance",
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    <Trophy className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-zinc-200">{text}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-fit bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              View Rating Details
            </Button>
          </div>
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-none bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-xl">
              <CardHeader className="border-b border-zinc-700/50">
                <CardTitle className="text-white">
                  Sample Rating Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-zinc-300">
                    <span className="font-medium">Elo Rating:</span>
                    <span className="font-bold text-purple-400">1850</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="font-medium">Glicko Rating:</span>
                    <span className="font-bold text-pink-400">1875 ± 35</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="font-medium">ML Predicted Ceiling:</span>
                    <span className="font-bold text-amber-400">2100</span>
                  </div>
                  <div className="h-32 w-full rounded-md bg-zinc-800/50 p-4 relative">
                    {/* Bar chart mock */}
                    {[1 / 3, 2 / 5, 1 / 2, 3 / 5, 1 / 2, 4 / 5, 2 / 3].map(
                      (height, i) => (
                        <div
                          key={i}
                          className="absolute bottom-0 w-2 rounded-full"
                          style={{
                            left: `${i * 15}%`,
                            height: `${height * 100}%`,
                            background:
                              i > 5
                                ? "linear-gradient(to top, purple, pink)"
                                : "linear-gradient(to top, blue, purple)",
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Improve Your Chess?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-zinc-300">
            Join thousands of players who are tracking their progress and
            improving their game with our advanced rating system.
          </p>
          <Button
            size="lg"
            className="mt-8 h-12 bg-gradient-to-r from-purple-600 to-blue-600 px-8 text-lg hover:from-purple-700 hover:to-blue-700 cursor-pointer"
            onClick={handlePlayClick}
          >
            Start Playing Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © 2023 Chess Rating Project. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              to="/about"
              className="text-sm text-zinc-500 transition-colors hover:text-purple-400"
            >
              About
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-zinc-500 transition-colors hover:text-purple-400"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-zinc-500 transition-colors hover:text-purple-400"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>

      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent className="bg-zinc-800 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Login Required
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-center py-4 text-zinc-300">
            Please log in to start playing chess and track your ratings.
          </div>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogAction
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => navigate("/auth/login")}
            >
              Login
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-950/30"
              onClick={() => setShowLoginPrompt(false)}
            >
              Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
