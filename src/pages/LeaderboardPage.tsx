import { useState, useEffect, useCallback } from 'react';
import { Trophy, Crown, Medal, Award, TrendingUp, Target, AlertCircle, Inbox, Calendar } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useAuth } from '@/context/AuthContext';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/quizApi';

type Period = 'weekly' | 'monthly' | 'all';

const periodLabels: Record<Period, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  all: 'All Time',
};

const periodDescriptions: Record<Period, string> = {
  weekly: 'Top performers from the last 7 days',
  monthly: 'Top performers from the last 30 days',
  all: 'All-time top performers',
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadLeaderboard = useCallback(async (p: Period) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchLeaderboard(p);
      setEntries(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(period);
  }, [period, loadLeaderboard]);

  const myEntry = entries.find((e) => e.user_id === user?.id);
  const myRank = entries.findIndex((e) => e.user_id === user?.id) + 1;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, bg: 'bg-amber-100 dark:bg-amber-950/40', color: 'text-amber-600 dark:text-amber-400', label: '1st' };
    if (rank === 2) return { icon: Medal, bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-500 dark:text-slate-400', label: '2nd' };
    if (rank === 3) return { icon: Award, bg: 'bg-orange-100 dark:bg-orange-950/40', color: 'text-orange-600 dark:text-orange-400', label: '3rd' };
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <PageContainer maxWidth="xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-accent-500" />
              <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">Leaderboard</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Top Performers</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{periodDescriptions[period]}</p>
          </div>
          <Button to="/quiz-setup" variant="primary" size="md">
            <Target className="h-4 w-4" />
            Take a Quiz
          </Button>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-2 mb-8 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 w-fit">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                period === p
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {p === 'weekly' && <Calendar className="h-4 w-4" />}
              {p === 'monthly' && <Calendar className="h-4 w-4" />}
              {p === 'all' && <Trophy className="h-4 w-4" />}
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {loading && <Loading fullPage text="Loading leaderboard..." />}

        {error && !loading && (
          <Card className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
              <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">Could not load leaderboard</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Something went wrong. Please try again.</p>
            <Button variant="outline" size="md" onClick={() => loadLeaderboard(period)}>Retry</Button>
          </Card>
        )}

        {!loading && !error && entries.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
              <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">No data yet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {period === 'weekly'
                ? 'No quizzes have been taken in the past week. Be the first!'
                : period === 'monthly'
                  ? 'No quizzes have been taken in the past month. Be the first!'
                  : 'No quiz attempts yet. Take a quiz to appear on the leaderboard!'}
            </p>
            <Button to="/quiz-setup" variant="primary" size="md">Take a Quiz</Button>
          </Card>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            {/* Podium - top 3 */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
                {/* 2nd place */}
                <div className="flex flex-col items-center pt-8 order-1">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-display text-xl sm:text-2xl font-bold mb-3 shadow-lg">
                    {entries[1].avatar_url ? (
                      <img src={entries[1].avatar_url} alt={entries[1].full_name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      getInitials(entries[1].full_name)
                    )}
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white text-center truncate w-full">{entries[1].full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-center">@{entries[1].username}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Medal className="h-4 w-4 text-slate-400" />
                    <span className="font-display text-lg font-bold text-slate-600 dark:text-slate-300">{Math.round(entries[1].avg_score)}%</span>
                  </div>
                  <div className="mt-3 w-full rounded-t-xl bg-slate-200 dark:bg-slate-700 h-20 sm:h-24 flex items-center justify-center">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-slate-500 dark:text-slate-400">2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center order-2">
                  <Crown className="h-7 w-7 text-amber-500 mb-1 animate-fade-in" />
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl gradient-bg text-white font-display text-2xl sm:text-3xl font-bold mb-3 shadow-xl shadow-primary-500/30 ring-4 ring-amber-300/50">
                    {entries[0].avatar_url ? (
                      <img src={entries[0].avatar_url} alt={entries[0].full_name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      getInitials(entries[0].full_name)
                    )}
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white text-center truncate w-full">{entries[0].full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-center">@{entries[0].username}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">{Math.round(entries[0].avg_score)}%</span>
                  </div>
                  <div className="mt-3 w-full rounded-t-xl gradient-bg h-28 sm:h-32 flex items-center justify-center shadow-lg">
                    <span className="font-display text-3xl sm:text-4xl font-bold text-white">1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center pt-12 order-3">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-display text-xl sm:text-2xl font-bold mb-3 shadow-lg">
                    {entries[2].avatar_url ? (
                      <img src={entries[2].avatar_url} alt={entries[2].full_name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      getInitials(entries[2].full_name)
                    )}
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white text-center truncate w-full">{entries[2].full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-center">@{entries[2].username}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Award className="h-4 w-4 text-orange-500" />
                    <span className="font-display text-lg font-bold text-orange-600 dark:text-orange-400">{Math.round(entries[2].avg_score)}%</span>
                  </div>
                  <div className="mt-3 w-full rounded-t-xl bg-orange-200 dark:bg-orange-900/40 h-16 sm:h-20 flex items-center justify-center">
                    <span className="font-display text-2xl sm:text-3xl font-bold text-orange-500 dark:text-orange-400">3</span>
                  </div>
                </div>
              </div>
            )}

            {/* My rank highlight (if not in top 3 visible) */}
            {myEntry && myRank > 3 && (
              <Card className="p-4 mb-4 border-primary-300 dark:border-primary-700">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40 font-display text-sm font-bold text-primary-600 dark:text-primary-400">
                    {myRank}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg text-white text-xs font-bold">
                    {myEntry.avatar_url ? (
                      <img src={myEntry.avatar_url} alt={myEntry.full_name} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      getInitials(myEntry.full_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {myEntry.full_name} <span className="text-primary-500 text-xs ml-1">(You)</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{myEntry.total_quizzes} quizzes · {myEntry.best_score}% best</p>
                  </div>
                  <p className="font-display font-bold text-lg text-primary-600 dark:text-primary-400">{Math.round(myEntry.avg_score)}%</p>
                </div>
              </Card>
            )}

            {/* Full leaderboard table */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Rankings</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">{entries.length} {entries.length === 1 ? 'player' : 'players'}</span>
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Student</div>
                <div className="col-span-2 text-center">Quizzes</div>
                <div className="col-span-2 text-center">Avg Score</div>
                <div className="col-span-3 text-right">Best Score</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((entry, i) => {
                  const rank = i + 1;
                  const badge = getRankBadge(rank);
                  const isMe = entry.user_id === user?.id;

                  return (
                    <div
                      key={entry.user_id}
                      className={`grid sm:grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${
                        isMe ? 'bg-primary-50/50 dark:bg-primary-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex items-center gap-2">
                        {badge ? (
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.bg}`}>
                            <badge.icon className={`h-5 w-5 ${badge.color}`} />
                          </div>
                        ) : (
                          <span className="font-display text-sm font-bold text-slate-400 dark:text-slate-500 w-9 text-center">{rank}</span>
                        )}
                      </div>

                      {/* Student */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg text-white text-xs font-bold flex-shrink-0">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt={entry.full_name} className="h-full w-full rounded-xl object-cover" />
                          ) : (
                            getInitials(entry.full_name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {entry.full_name}
                            {isMe && <span className="text-primary-500 text-xs ml-1.5">(You)</span>}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{entry.username}</p>
                        </div>
                      </div>

                      {/* Quizzes */}
                      <div className="col-span-2 text-center">
                        <p className="font-display font-bold text-slate-900 dark:text-white">{entry.total_quizzes}</p>
                        <p className="text-xs text-slate-400 sm:hidden">Quizzes</p>
                      </div>

                      {/* Avg Score */}
                      <div className="col-span-2 text-center">
                        <p className={`font-display font-bold ${
                          entry.avg_score >= 80 ? 'text-success-600 dark:text-success-400' :
                          entry.avg_score >= 60 ? 'text-primary-600 dark:text-primary-400' :
                          'text-warning-600 dark:text-warning-400'
                        }`}>
                          {Math.round(entry.avg_score)}%
                        </p>
                        <p className="text-xs text-slate-400 sm:hidden">Avg</p>
                      </div>

                      {/* Best Score */}
                      <div className="col-span-3 text-right flex items-center justify-end gap-2">
                        <div className="hidden sm:flex items-center gap-1.5">
                          <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${entry.best_score >= 80 ? 'bg-success-500' : entry.best_score >= 60 ? 'bg-primary-500' : 'bg-warning-500'}`}
                              style={{ width: `${entry.best_score}%` }}
                            />
                          </div>
                        </div>
                        <p className={`font-display font-bold text-lg ${
                          entry.best_score >= 80 ? 'text-success-600 dark:text-success-400' :
                          entry.best_score >= 60 ? 'text-primary-600 dark:text-primary-400' :
                          'text-warning-600 dark:text-warning-400'
                        }`}>
                          {entry.best_score}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button to="/dashboard" variant="outline" size="md">
                Back to Dashboard
              </Button>
              <Button to="/analytics" variant="ghost" size="md">
                <TrendingUp className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
