'use client';

import { useState, useEffect } from 'react';
import { X, Search, Bell, Send, UserCircle, Check } from 'lucide-react';
import { useKPI, User } from '@/context/KPIContext';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendNotificationModal({ isOpen, onClose }: SendNotificationModalProps) {
  const { users } = useKPI();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [title, setTitle] = useState('Nhắc nhở hoàn thành KPI tháng');
  const [message, setMessage] = useState(
    'Chào bạn, Hệ thống ghi nhận bạn chưa hoàn thành các chỉ tiêu KPI của tháng này. Vui lòng cập nhật và hoàn thiện công việc để đạt kế hoạch đề ra. Trân trọng!'
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Clear selections and reset fields on open
      setSelectedUserIds([]);
      setSearchTerm('');
      setTitle('Nhắc nhở hoàn thành KPI tháng');
      setMessage(
        'Chào bạn, Hệ thống ghi nhận bạn chưa hoàn thành các chỉ tiêu KPI của tháng này. Vui lòng cập nhật và hoàn thiện công việc để đạt kế hoạch đề ra. Trân trọng!'
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter users based on search term (search by name, department, position)
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      u.department.toLowerCase().includes(search) ||
      u.position.toLowerCase().includes(search)
    );
  });

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSend = async () => {
    if (selectedUserIds.length === 0) {
      alert('Vui lòng chọn ít nhất một người nhận!');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/notifications/check-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          title,
          message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.errors && data.errors.length > 0) {
          alert(`${data.message}\n\nChi tiết lỗi gửi Email:\n- ${data.errors.join('\n- ')}`);
        } else {
          alert(data.message || `Gửi thông báo thành công cho ${selectedUserIds.length} người dùng!`);
        }
        onClose();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error: any) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#384252]/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#555cf8]/10 rounded-xl text-[#555cf8]">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Gửi Thông Báo</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Gửi thông báo test / nhắc nhở cho các nhân sự được chọn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Form fields */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Tiêu đề thông báo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo..."
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#555cf8] focus:ring-2 focus:ring-[#555cf8]/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Nội dung thông báo</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Nhập nội dung thông báo..."
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#555cf8] focus:ring-2 focus:ring-[#555cf8]/10 transition-all font-medium resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* User selector section */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <label className="text-[13px] font-bold text-gray-700">
                Chọn người nhận ({selectedUserIds.length}/{filteredUsers.length})
              </label>
              
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm nhân sự..."
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#555cf8] transition-all font-medium"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Selection control */}
            <div className="flex justify-between items-center mb-2 px-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] font-extrabold text-[#555cf8] hover:underline uppercase tracking-wide"
              >
                {selectedUserIds.length === filteredUsers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả hiển thị'}
              </button>
            </div>

            {/* Users grid list */}
            <div className="border border-gray-100 rounded-xl max-h-60 overflow-y-auto no-scrollbar divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleUser(u.id)}
                      className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/80 transition-colors cursor-pointer ${
                        isChecked ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom beautiful checkbox */}
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-[#555cf8] border-[#555cf8] text-white shadow-sm shadow-[#555cf8]/20'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>

                        {/* Avatar */}
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            className="w-8 h-8 rounded-full border border-gray-100 object-cover"
                            alt="Avatar"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-gray-100 flex items-center justify-center text-[#555cf8]">
                            <UserCircle size={18} />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800 leading-tight">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {u.position} • {u.department}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  Không tìm thấy nhân sự nào khớp với từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-[#f8fafc]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || selectedUserIds.length === 0}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl font-bold text-xs bg-[#555cf8] text-white hover:bg-[#4a51e2] shadow-lg shadow-[#555cf8]/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send size={12} />
            {isSending ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </div>
      </div>
    </div>
  );
}
