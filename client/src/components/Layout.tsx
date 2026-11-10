import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  FileText,
  Bell,
  Settings,
  ShieldCheck,
  KeyRound,
  LogOut,
  Menu,
  X,
  BookOpen,
  UserCheck,
  Award,
  Layers,
  Calendar,
  Sparkles,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { api } from '../services/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, tenant, license, logout, hasRole, activeChildId, setActiveChildId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [childrenList, setChildrenList] = useState<any[]>([]);

  // Fetch unread notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications/my');
        if (res.data.success) {
          setUnreadNotifs(res.data.data.unreadCount || 0);
        }
      } catch (err) {
        // silent
      }
    };
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // If Parent, fetch linked children for the child switcher
  useEffect(() => {
    const fetchParentChildren = async () => {
      if (user?.role === 'PARENT') {
        try {
          const res = await api.get('/parents/children');
          if (res.data.success && res.data.data.length > 0) {
            // Map to child structures
            const children = res.data.data.map((r: any) => ({
              ...r,
              studentId: r.student,
            }));
            setChildrenList(children);
            if (!activeChildId && children.length > 0) {
              setActiveChildId(children[0].student._id);
            }
          }
        } catch (err) {
          // silent
        }
      }
    };
    fetchParentChildren();
  }, [user]);

  // Define navigation items according to user's granular role
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    if (user.role === 'SUPER_ADMIN') {
      return [
        { label: 'Platform Overview', path: '/super-admin', icon: Layers },
        { label: 'Registered Schools', path: '/super-admin/schools', icon: Building2 },
        { label: 'Software Licenses', path: '/super-admin/licenses', icon: KeyRound },
        { label: 'Platform Settings', path: '/super-admin/settings', icon: Settings },
        { label: 'Audit Logs', path: '/super-admin/audit-logs', icon: ShieldCheck },
      ];
    }

    if (user.role === 'SCHOOL_ADMIN') {
      return [
        { label: 'School Dashboard', path: '/dashboard', icon: Layers },
        { label: 'Attendance Hub', path: '/attendance', icon: CalendarCheck },
        { label: 'Students Directory', path: '/students', icon: GraduationCap },
        { label: 'Staff & Teachers', path: '/staff', icon: UserCheck },
        { label: 'Parent Portal Links', path: '/parents', icon: Users },
        { label: 'Academic Setup', path: '/academic-setup', icon: BookOpen },
        { label: 'Examinations & Marks', path: '/examinations', icon: Award },
        { label: 'Leave Requests', path: '/leave', icon: Calendar },
        { label: 'Reports & Downloads', path: '/reports', icon: FileText },
        { label: 'Announcements', path: '/announcements', icon: Bell },
        { label: 'Notification Logs', path: '/notifications', icon: Bell },
      ];
    }

    if (user.role === 'PRINCIPAL') {
      return [
        { label: 'Executive Dashboard', path: '/principal', icon: Layers },
        { label: 'School Attendance', path: '/attendance', icon: CalendarCheck },
        { label: 'Student Directory', path: '/students', icon: GraduationCap },
        { label: 'Staff Overview', path: '/staff', icon: UserCheck },
        { label: 'Exam Performance', path: '/examinations', icon: Award },
        { label: 'Leave Approvals', path: '/leave', icon: Calendar },
        { label: 'Official Reports', path: '/reports', icon: FileText },
        { label: 'Announcements', path: '/announcements', icon: Bell },
      ];
    }

    if (user.role === 'COORDINATOR') {
      return [
        { label: 'Coordinator Hub', path: '/coordinator', icon: Layers },
        { label: 'Teacher Allocations', path: '/academic-setup', icon: BookOpen },
        { label: 'Class Attendance', path: '/attendance', icon: CalendarCheck },
        { label: 'Student Records', path: '/students', icon: GraduationCap },
        { label: 'Exam Coordination', path: '/examinations', icon: Award },
        { label: 'Announcements', path: '/announcements', icon: Bell },
      ];
    }

    if (user.role === 'TEACHER') {
      return [
        { label: 'Mark Attendance', path: '/teacher/attendance', icon: CalendarCheck },
        { label: 'Attendance History', path: '/attendance', icon: Calendar },
        { label: 'My Students', path: '/students', icon: GraduationCap },
        { label: 'Marks Entry', path: '/examinations', icon: Award },
        { label: 'Leave Requests', path: '/leave', icon: Calendar },
        { label: 'Announcements', path: '/announcements', icon: Bell },
      ];
    }

    if (user.role === 'PARENT') {
      return [
        { label: 'Child Dashboard', path: '/parent/portal', icon: Layers },
        { label: 'Attendance Calendar', path: '/parent/attendance', icon: CalendarCheck },
        { label: 'Apply Leave', path: '/parent/leave', icon: Calendar },
        { label: 'Report Cards', path: '/parent/report-cards', icon: Award },
        { label: 'School Notices', path: '/announcements', icon: Bell },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center text-white font-black shadow-sm">
                6C
              </div>
              <div>
                <span className="text-sm font-extrabold text-navy-900 tracking-tight block">
                  School Operations Platform
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  6th Civilians Corporation
                </span>
              </div>
            </Link>

            {/* School / Tenant indicator */}
            {tenant && (
              <div className="hidden md:flex items-center gap-2 pl-4 ml-4 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-800 max-w-[280px] truncate">
                  {tenant.name}
                </span>
                <Badge variant="neutral">{tenant.affiliation}</Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Child Switcher for Parents */}
            {user?.role === 'PARENT' && childrenList.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">Child:</span>
                <select
                  value={activeChildId || ''}
                  onChange={(e) => setActiveChildId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {childrenList.map((rel) => (
                    <option key={rel.studentId?._id} value={rel.studentId?._id}>
                      {rel.studentId?.firstName} {rel.studentId?.lastName} ({rel.studentId?.classId?.name || 'Class'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* License Status Badge */}
            {license && (
              <div className="hidden sm:block">
                <Badge variant={license.status === 'ACTIVE' ? 'success' : 'danger'}>
                  <Sparkles className="w-3 h-3 mr-1 inline" />
                  PERMANENT LICENSE
                </Badge>
              </div>
            )}

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 block uppercase tracking-wider">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 p-4 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Deployment Mode
              </span>
              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                Multi-Tenant Enterprise
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Product Owner: 6th Civilians
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-white h-full p-4 space-y-1 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase text-slate-500">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-navy-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
