#include <Eigen/Dense>
#include <emscripten/bind.h>
#include <cmath>

class EKF {
public:
    EKF() { reset(0.0, 0.0, 1.5707963267948966); }

    void reset(double x, double y, double heading) {
      state.setZero();
      state(0) = x;
      state(1) = y;
      state(2) = heading;
      state(3) = 1.0;
      covariance.setZero();
      covariance.diagonal() << 0.01, 0.01, 0.01, 0.01, 0.01;
    }

    void predict(double speed, double yaw_rate, double dt,
                 double speed_sigma, double yaw_sigma) {
      const double heading = state(2);
      const double speed_scale = state(3);

      Eigen::Matrix<double, 5, 5> transition = Eigen::Matrix<double, 5, 5>::Identity();
      transition(0, 2) = -dt * speed_scale * speed * std::sin(heading);
      transition(0, 3) = dt * speed * std::cos(heading);
      transition(1, 2) = dt * speed_scale * speed * std::cos(heading);
      transition(1, 3) = dt * speed * std::sin(heading);
      transition(2, 4) = -dt;

      Eigen::Matrix<double, 5, 2> noise_gain = Eigen::Matrix<double, 5, 2>::Zero();
      noise_gain(0, 0) = dt * speed_scale * std::cos(heading);
      noise_gain(1, 0) = dt * speed_scale * std::sin(heading);
      noise_gain(2, 1) = dt;

      Eigen::Matrix2d noise_covariance = Eigen::Matrix2d::Zero();
      noise_covariance.diagonal() << speed_sigma * speed_sigma,
                                     yaw_sigma * yaw_sigma;

      state(0) += dt * speed_scale * speed * std::cos(heading);
      state(1) += dt * speed_scale * speed * std::sin(heading);
      state(2) += dt * (yaw_rate - state(4));

      covariance = transition * covariance * transition.transpose() +
                   noise_gain * noise_covariance * noise_gain.transpose();
    }

    void update(double gps_x, double gps_y, double gps_sigma) {
      Eigen::Matrix<double, 2, 5> observation = Eigen::Matrix<double, 2, 5>::Zero();
      observation(0, 0) = 1.0;
      observation(1, 1) = 1.0;

      Eigen::Matrix2d measurement_covariance = Eigen::Matrix2d::Identity();
      measurement_covariance *= gps_sigma * gps_sigma;

      const Eigen::Vector2d measurement(gps_x, gps_y);
      const Eigen::Vector2d innovation = measurement - observation * state;
      const Eigen::Matrix2d innovation_covariance =
          observation * covariance * observation.transpose() + measurement_covariance;
      const Eigen::Matrix<double, 5, 2> gain =
          covariance * observation.transpose() *
          innovation_covariance.ldlt().solve(Eigen::Matrix2d::Identity());

      state += gain * innovation;
      const Eigen::Matrix<double, 5, 5> residual =
          Eigen::Matrix<double, 5, 5>::Identity() - gain * observation;
      covariance = residual * covariance * residual.transpose() +
                   gain * measurement_covariance * gain.transpose();
      covariance = 0.5 * (covariance + covariance.transpose());
    }

    double getX() const { return state(0); }
    double getY() const { return state(1); }
    double getHeading() const { return state(2); }

private:
    // x, y, heading, speed scale, gyro bias
    Eigen::Matrix<double, 5, 1> state;
    Eigen::Matrix<double, 5, 5> covariance;
};

EMSCRIPTEN_BINDINGS(kalman_filter_module) {
  emscripten::class_<EKF>("EKF")
      .constructor<>()
      .function("reset", &EKF::reset)
      .function("predict", &EKF::predict)
      .function("update", &EKF::update)
      .function("getX", &EKF::getX)
      .function("getY", &EKF::getY)
      .function("getHeading", &EKF::getHeading);
}