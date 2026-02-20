import { AlertCircle, CheckCircle2, ExternalLink, Github, Loader2 } from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

/**
 * Component for connecting/disconnecting the GitHub account.
 *
 * Intent: Provide a clear, premium UI for GitHub OAuth Device Flow.
 */
export const GitHubConnectCard: React.FC<{ className?: string }> = ({ className }) => {
  const { status, isAuthenticated, username, deviceCode, error, connect, logout } = useGitHubAuth();

  const isConnecting = status === 'checking' || status === 'polling';

  return (
    <Card
      className={cn('w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm', className)}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Github className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>GitHub Integration</CardTitle>
            <CardDescription>Sync your local board with GitHub Projects</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === 'idle' && (
          <p className="text-muted-foreground text-sm">
            Connect your GitHub account to enable bi-directional sync for tasks and issues.
          </p>
        )}

        {status === 'authenticated' && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Connected as @{username}</p>
              <p className="opacity-80">You can now link your boards to GitHub Projects.</p>
            </div>
          </div>
        )}

        {(status === 'awaiting_code' || status === 'polling') && deviceCode && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-sm font-medium">Your verification code:</p>
              <div className="bg-background py-2 text-3xl font-mono font-bold tracking-widest text-primary border rounded select-all">
                {deviceCode.userCode}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter this code on GitHub to authorize the application.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 w-full gap-2 border-primary/30 hover:bg-primary/10"
              >
                <a href={deviceCode.verificationUri} target="_blank" rel="noopener noreferrer">
                  Visit {deviceCode.verificationUri} <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2 py-2 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Waiting for authorization...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Authentication Error</p>
              <p className="opacity-80">{error}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {!isAuthenticated ? (
          <Button onClick={connect} disabled={isConnecting} className="w-full gap-2">
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : status === 'error' ? (
              'Retry Connection'
            ) : (
              <>
                <Github className="h-4 w-4" />
                Connect to GitHub
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={logout}
            className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Logout from GitHub
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
