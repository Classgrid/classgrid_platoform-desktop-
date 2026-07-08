import React, { useState, useEffect } from 'react';
import { Search, Compass, Users } from 'lucide-react';
import { Input } from '@/components/marketing_ui/input';
import { Button } from '@/components/marketing_ui/button';
import { Spinner } from '@/components/marketing_ui/spinner';
import { toast } from 'sonner';

const MOCK_CLASSROOMS = [
  { id: '1', name: 'Advanced Mathematics', subject: 'Mathematics', teacher: 'Dr. Alan Turing' },
  { id: '2', name: 'Computer Science 101', subject: 'Computer Science', teacher: 'Grace Hopper' },
  { id: '3', name: 'Physics for Engineers', subject: 'Physics', teacher: 'Albert Einstein' },
  { id: '4', name: 'Introduction to Philosophy', subject: 'Philosophy', teacher: 'Socrates' },
  { id: '5', name: 'Web Development Bootcamp', subject: 'Computer Science', teacher: 'Tim Berners-Lee' },
];

export function DiscoverClassroomsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredClassrooms = MOCK_CLASSROOMS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.teacher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRequestJoin = (id: string) => {
    setRequestedIds(prev => new Set(prev).add(id));
    toast.success("Join request sent to the teacher!");
  };

  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-purple-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Compass size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Discover Classrooms</h1>
        </div>
        <p className="text-gray-500 text-lg">Find and join public classrooms across the network.</p>
      </div>

      {/* Search */}
      <div className="mb-8 relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={20} />
        </div>
        <Input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by subject, teacher, or classroom name..."
          className="w-full pl-10 h-14 text-lg bg-white border-gray-200 focus:border-indigo-500 rounded-xl shadow-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Spinner className="h-8 w-8 text-indigo-600" />
          <p className="text-gray-500 font-medium">Discovering classrooms...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClassrooms.map((classroom, index) => {
            const gradient = gradients[index % gradients.length];
            const isRequested = requestedIds.has(classroom.id);

            return (
              <div 
                key={classroom.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className={`h-24 w-full bg-gradient-to-r ${gradient}`} />
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">{classroom.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{classroom.subject}</p>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200 shrink-0">
                      {classroom.teacher.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">{classroom.teacher}</span>
                  </div>

                  <div className="mt-auto">
                    <Button 
                      className={`w-full font-medium ${isRequested ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      onClick={() => !isRequested && handleRequestJoin(classroom.id)}
                      disabled={isRequested}
                    >
                      {isRequested ? 'Requested' : 'Request to Join'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredClassrooms.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No classrooms found</h3>
              <p>We couldn't find any public classrooms matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
