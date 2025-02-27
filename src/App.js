import React, { useState, useEffect } from 'react';
import { LineChart, PieChart, Pie, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState(() => {
    const savedSubscriptions = localStorage.getItem('subscriptions');
    return savedSubscriptions ? JSON.parse(savedSubscriptions) : [];
  });
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [paymentDate, setPaymentDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalYearly, setTotalYearly] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories] = useState(['すべて', 'エンターテイメント', 'ソフトウェア', '音楽', '動画配信', 'その他']);
  const [category, setCategory] = useState('その他');
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [chartData, setChartData] = useState([]);
  const [reminderDays, setReminderDays] = useState(3);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    calculateTotals();
    prepareChartData();
    checkPaymentDates();
  }, [subscriptions]);

  // 定期的に支払い日をチェック（1日1回）
  useEffect(() => {
    const checkInterval = setInterval(() => {
      checkPaymentDates();
    }, 86400000); // 24時間ごと

    // 初回実行
    checkPaymentDates();
    
    return () => clearInterval(checkInterval);
  }, [subscriptions, reminderDays]);

  const checkPaymentDates = () => {
    const currentDate = new Date();
    const newNotifications = [];
    
    subscriptions.forEach(sub => {
      // 支払日から日付を抽出（「毎月15日」から「15」を取得）
      const dayMatch = sub.paymentDate.match(/(\d+)日/);
      if (!dayMatch) return;
      
      const paymentDay = parseInt(dayMatch[1]);
      const today = currentDate.getDate();
      
      // 支払い日まであとX日以内かチェック
      let daysUntilPayment;
      
      if (paymentDay > today) {
        // 今月の支払い日
        daysUntilPayment = paymentDay - today;
      } else {
        // 来月の支払い日
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        daysUntilPayment = (lastDayOfMonth - today) + paymentDay;
      }
      
      if (daysUntilPayment <= reminderDays) {
        newNotifications.push({
          id: Date.now() + Math.random(),
          subscription: sub,
          daysRemaining: daysUntilPayment,
          message: `「${sub.name}」の支払いがあと${daysUntilPayment}日後に予定されています。`
        });
      }
    });
    
    setNotifications(newNotifications);
  };

  const calculateTotals = () => {
    let monthly = 0;
    let yearly = 0;

    subscriptions.forEach((sub) => {
      if (sub.cycle === 'monthly') {
        monthly += parseFloat(sub.price);
        yearly += parseFloat(sub.price) * 12;
      } else {
        yearly += parseFloat(sub.price);
        monthly += parseFloat(sub.price) / 12;
      }
    });

    setTotalMonthly(monthly);
    setTotalYearly(yearly);
  };

  const prepareChartData = () => {
    // カテゴリ別の支出集計データ
    const categoryData = categories
      .filter(cat => cat !== 'すべて')
      .map(cat => {
        const categorySubs = subscriptions.filter(sub => sub.category === cat);
        let amount = 0;
        
        categorySubs.forEach(sub => {
          if (sub.cycle === 'monthly') {
            amount += parseFloat(sub.price);
          } else {
            amount += parseFloat(sub.price) / 12;
          }
        });
        
        return {
          name: cat,
          value: amount
        };
      })
      .filter(item => item.value > 0);
    
    setChartData(categoryData);
  };

  const addSubscription = () => {
    if (!name || !price || !paymentDate) return;

    const newSubscription = {
      id: Date.now(),
      name,
      price: parseFloat(price),
      cycle,
      paymentDate,
      category,
      createdAt: new Date().toISOString()
    };

    setSubscriptions([...subscriptions, newSubscription]);
    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCycle('monthly');
    setPaymentDate('');
    setCategory('その他');
  };

  const deleteSubscription = (id) => {
    setSubscriptions(subscriptions.filter(sub => sub.id !== id));
  };
  
  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(note => note.id !== notificationId));
  };

  const filteredSubscriptions = selectedCategory === 'すべて' || selectedCategory === 'all' 
    ? subscriptions 
    : subscriptions.filter(sub => sub.category === selectedCategory);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 月ごとの支出推移データを生成
  const generateMonthlyTrendData = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months.map((month, index) => {
      // 実際には過去のデータをここで集計するが、今回はデモ用にランダムデータを生成
      const monthlyAmount = totalMonthly * (0.9 + Math.random() * 0.2);
      return {
        name: month,
        amount: monthlyAmount
      };
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6">サブスク管理アプリ</h1>
      
      {/* 通知エリア */}
      {notifications.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-yellow-700 mb-2">支払い通知</h2>
          <div className="space-y-2">
            {notifications.map(notification => (
              <div key={notification.id} className="flex justify-between items-center bg-white p-3 rounded border border-yellow-200">
                <div>
                  <p className="font-medium">{notification.message}</p>
                  <p className="text-sm text-gray-600">
                    金額: {formatCurrency(notification.subscription.price)} | 
                    {notification.subscription.cycle === 'monthly' ? ' 月額' : ' 年額'}
                  </p>
                </div>
                <button 
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center">
            <label className="text-sm mr-2">通知日数: </label>
            <select 
              value={reminderDays} 
              onChange={(e) => setReminderDays(parseInt(e.target.value))}
              className="p-1 border rounded text-sm"
            >
              <option value={1}>1日前</option>
              <option value={3}>3日前</option>
              <option value={5}>5日前</option>
              <option value={7}>7日前</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-xl font-semibold text-blue-800">月額合計</h2>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalMonthly)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-xl font-semibold text-green-800">年間合計</h2>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalYearly)}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          {showAddForm ? 'キャンセル' : '新しいサブスクを追加'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">新しいサブスクを追加</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">サービス名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Netflix"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">料金</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払いサイクル</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="monthly">月額</option>
                <option value="yearly">年額</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払日</label>
              <input
                type="text"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="毎月15日"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {categories.filter(cat => cat !== 'すべて').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={resetForm} 
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              リセット
            </button>
            <button 
              onClick={addSubscription} 
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              保存
            </button>
          </div>
        </div>
      )}
      
      {/* タブ切り替え */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('list')} 
            className={`py-2 px-4 flex-1 text-center ${activeTab === 'list' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600'}`}
          >
            一覧
          </button>
          <button 
            onClick={() => setActiveTab('chart')} 
            className={`py-2 px-4 flex-1 text-center ${activeTab === 'chart' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600'}`}
          >
            グラフ
          </button>
        </div>
        
        {activeTab === 'list' ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">サブスク一覧</h2>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 border rounded"
              >
                {categories.map((cat, index) => (
                  <option key={index} value={cat === 'すべて' ? 'all' : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            {filteredSubscriptions.length === 0 ? (
              <p className="text-center py-4 text-gray-500">サブスクリプションがありません</p>
            ) : (
              <div className="divide-y">
                {filteredSubscriptions.map((sub) => (
                  <div key={sub.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-sm text-gray-600">
                        {sub.category} | {sub.paymentDate} | 
                        {sub.cycle === 'monthly' ? ' 月額' : ' 年額'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="font-semibold">
                        {formatCurrency(sub.price)}
                      </div>
                      <button 
                        onClick={() => deleteSubscription(sub.id)} 
                        className="text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">支出分析</h2>
            
            {subscriptions.length === 0 ? (
              <p className="text-center py-4 text-gray-500">データがありません</p>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">カテゴリ別支出（月額）</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value), "月額"]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">月別支出推移</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={generateMonthlyTrendData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value), "月額支出"]} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name="月額支出" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;