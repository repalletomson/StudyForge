// import { useState } from 'react';
// import { Outlet, Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import {
//   FiMenu,
//   FiX,
//   FiHome,
//   FiBook,
//   FiUsers,
//   FiLogOut,
//   FiUser,
//   FiSettings,
//   FiBell,
//   FiSearch,
//   FiEdit3
// } from 'react-icons/fi';
// import ProfileModal from '../profile/ProfileModal';
// const DashboardLayout = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
//   const { user, logout, hasRole } = useAuth();
//   const location = useLocation();
//   const navigation = [
//     // { name: 'Dashboard', href: '/dashboard', icon: FiHome, current: location.pathname === '/dashboard' },
//     { name: 'Programs', href: '/dashboard/programs', icon: FiBook, current: location.pathname.startsWith('/dashboard/programs') },
//     { name: 'Publishing', href: '/dashboard/publishing', icon: FiBell, current: location.pathname === '/dashboard/publishing' },
//     ...(hasRole('admin') ? [
//       { name: 'Users', href: '/dashboard/users', icon: FiUsers, current: location.pathname === '/dashboard/users' }
//     ] : [])
//   ];
//   const handleLogout = async () => {
//     try {
//       await logout();
//     } catch (error) {
//       // Error handling is done in auth context
//     }
//   };
//   return (
//     <div className="h-screen flex overflow-hidden bg-black">
//       {}
//       <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
//         <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
//         <div className="relative flex-1 flex flex-col max-w-xs w-full bg-black shadow-2xl border-r border-gray-800">
//           <div className="absolute top-0 right-0 -mr-12 pt-2">
//             <button
//               className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500"
//               onClick={() => setSidebarOpen(false)}
//             >
//               <FiX className="h-6 w-6 text-white" />
//             </button>
//           </div>
//           <SidebarContent navigation={navigation} user={user} onLogout={handleLogout} />
//         </div>
//       </div>
//       {}
//       <div className="hidden md:flex md:flex-shrink-0">
//         <div className="flex flex-col w-72">
//           <SidebarContent navigation={navigation} user={user} onLogout={handleLogout} />
//         </div>
//       </div>
//       {}
//       <div className="flex flex-col w-0 flex-1 overflow-hidden">
//         {}
//         <div className="relative z-10 flex-shrink-0 flex h-16 bg-black shadow-sm border-b border-gray-800">
//           <button
//             className="px-4 border-r border-gray-800 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500 md:hidden hover:bg-gray-900 hover:text-gray-300 transition-colors"
//             onClick={() => setSidebarOpen(true)}
//           >
//             <FiMenu className="h-6 w-6" />
//           </button>
//           <div className="flex-1 px-4 flex justify-between items-center">
//             <div className="flex-1 flex">
//               <div className="w-full flex md:ml-0">
//                 <div className="relative w-full text-gray-400 focus-within:text-gray-300">
//                   <div className="flex items-center h-16">
//                     {}
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="ml-4 flex items-center md:ml-6 space-x-4">
//               {}
//               <div className="relative hidden lg:block">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FiSearch className="h-5 w-5 text-gray-500" />
//                 </div>
//                 <input
//                   className="block w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg leading-5 placeholder-gray-500 text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
//                   placeholder="Search..."
//                   type="search"
//                 />
//               </div>
//               {}
//               <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-900 rounded-lg transition-colors">
//                 <FiBell className="h-6 w-6" />
//               </button>
//               {}
//               <div className="flex items-center space-x-3">
//                 <div className="flex items-center space-x-2">
//                   <img
//                     src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || user?.email}&background=8b5cf6&color=fff&size=32`}
//                     alt="Profile"
//                     className="h-8 w-8 rounded-full object-cover border-2 border-gray-700 shadow-sm"
//                   />
//                   <div className="hidden lg:block">
//                     <p className="text-sm font-medium text-white">
//                       {user?.fullName || user?.email?.split('@')[0]}
//                     </p>
//                     <p className="text-xs text-gray-400 capitalize">
//                       {user?.role}
//                     </p>
//                   </div>
//                 </div>
//                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                   user?.role === 'admin' ? 'bg-red-900/50 text-red-400' : 
//                   user?.role === 'editor' ? 'bg-violet-900/50 text-violet-400' : 'bg-gray-800 text-gray-300'
//                 }`}>
//                   {user?.role}
//                 </span>
//                 {}
//                 <div className="relative">
//                   <button
//                     onClick={() => setIsProfileModalOpen(true)}
//                     className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-900 rounded-lg transition-colors"
//                     title="Edit Profile"
//                   >
//                     <FiEdit3 className="h-4 w-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//         {}
//         <main className="flex-1 relative overflow-y-auto focus:outline-none bg-black">
//           <div className="py-8">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
//               <Outlet />
//             </div>
//           </div>
//         </main>
//       </div>
//       {}
//       <ProfileModal
//         isOpen={isProfileModalOpen}
//         onClose={() => setIsProfileModalOpen(false)}
//       />
//     </div>
//   );
// };
// const SidebarContent = ({ navigation, user, onLogout }) => (
//   <div className="flex-1 flex flex-col min-h-0 bg-black shadow-lg border-r border-gray-800">
//     <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
//       <div className="flex items-center flex-shrink-0 px-4 mb-8">
//         <div className="flex items-center">
//           {}
//           <div>
//             <h1 className="text-xl font-bold text-white font-heading">StudyForge</h1>
//             <p className="text-xs text-gray-400">Educational Content Management</p>
//           </div>
//         </div>
//       </div>
//       <nav className="mt-5 flex-1 px-2 space-y-1">
//         {navigation.map((item) => {
//           const Icon = item.icon;
//           return (
//             <Link
//               key={item.name}
//               to={item.href}
//               className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
//                 item.current
//                   ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20'
//                   : 'text-gray-300 hover:bg-gray-900 hover:text-white'
//               }`}
//             >
//               <Icon
//                 className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
//                   item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
//                 }`}
//               />
//               {item.name}
//             </Link>
//           );
//         })}
//       </nav>
//     </div>
//     <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
//       <div className="flex items-center w-full">
//         <div className="flex-shrink-0">
//           <img
//             src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || user?.email}&background=8b5cf6&color=fff&size=40`}
//             alt="Profile"
//             className="h-10 w-10 rounded-full object-cover border-2 border-gray-700"
//           />
//         </div>
//         <div className="ml-3 flex-1">
//           <p className="text-sm font-medium text-white truncate">
//             {user?.fullName || user?.email?.split('@')[0]}
//           </p>
//           <p className="text-xs text-gray-400 capitalize">
//             {user?.role} Account
//           </p>
//         </div>
//         <div className="flex space-x-2">
//           <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-900 rounded-lg transition-colors">
//             <FiSettings className="h-4 w-4" />
//           </button>
//           <button
//             onClick={onLogout}
//             className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
//             title="Logout"
//           >
//             <FiLogOut className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
// );
// export default DashboardLayout;
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiBook, FiBell, FiUsers, FiLogOut, FiSettings, FiEdit3 } from 'react-icons/fi';
import ProfileModal from '../profile/ProfileModal';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Programs', href: '/dashboard/programs', icon: FiBook, current: location.pathname.startsWith('/dashboard/programs') },
    { name: 'Publishing', href: '/dashboard/publishing', icon: FiBell, current: location.pathname === '/dashboard/publishing' },
    ...(user?.role === 'admin' ? [
      { name: 'Users', href: '/dashboard/users', icon: FiUsers, current: location.pathname === '/dashboard/users' }
    ] : [])
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-black">
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-black shadow-2xl border-r border-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button className="ml-1 flex items-center justify-center h-10 w-10 rounded-full" onClick={() => setSidebarOpen(false)}>
              <FiX className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} user={user} onLogout={handleLogout} />
        </div>
      </div>

      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <SidebarContent navigation={navigation} user={user} onLogout={handleLogout} />
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-black shadow-sm border-b border-gray-800">
          <button className="px-4 border-r border-gray-800 text-gray-400 md:hidden" onClick={() => setSidebarOpen(true)}>
            <FiMenu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            <div className="ml-4 flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-900 rounded-lg">
                <FiBell className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || user?.email}&background=8b5cf6&color=fff&size=32`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border-2 border-gray-700"
                />
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-white">{user?.fullName || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'admin' ? 'bg-red-900/50 text-red-400' : 
                user?.role === 'editor' ? 'bg-violet-900/50 text-violet-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {user?.role}
              </span>
              <button onClick={() => setIsProfileModalOpen(true)} className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-900 rounded-lg" title="Edit Profile">
                <FiEdit3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto bg-black">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
};

const SidebarContent = ({ navigation, user, onLogout }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-black shadow-lg border-r border-gray-800">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">StudyForge</h1>
          <p className="text-xs text-gray-400">Content Management</p>
        </div>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                item.current
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${item.current ? 'text-white' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
    <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
      <div className="flex items-center w-full">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || user?.email}&background=8b5cf6&color=fff&size=40`}
          alt="Profile"
          className="h-10 w-10 rounded-full border-2 border-gray-700"
        />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.email?.split('@')[0]}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role} Account</p>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-900 rounded-lg">
            <FiSettings className="h-4 w-4" />
          </button>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-lg" title="Logout">
            <FiLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardLayout;