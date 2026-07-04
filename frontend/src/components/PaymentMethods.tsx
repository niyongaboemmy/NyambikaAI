import { Smartphone, CreditCard, Wallet } from "lucide-react";

export default function PaymentMethods() {
  const paymentMethods = [
    {
      name: "MTN MoMo",
      description: "Mobile Money",
      icon: Smartphone,
      color: "bg-gold-500",
    },
    {
      name: "Airtel Money",
      description: "Mobile Money",
      icon: Smartphone,
      color: "bg-red-500",
    },
    {
      name: "PayPal",
      description: "International",
      icon: Wallet,
      color: "bg-gold-500",
    },
    {
      name: "Bank Cards",
      description: "Visa, Mastercard",
      icon: CreditCard,
      color: "bg-gold-500",
    },
  ];

  return (
    <section className="py-20 px-4 md:px-6 bg-slate-100 dark:bg-slate-800">
      <div className=" ">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Uburyo bwo Kwishyura
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Secure & Convenient Payment Options
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {paymentMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div
                key={index}
                className="glassmorphism rounded-3xl p-8 text-center hover:scale-105 transition-all duration-300 neumorphism"
              >
                <div
                  className={`w-16 h-16 ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className="text-white h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {method.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {method.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
