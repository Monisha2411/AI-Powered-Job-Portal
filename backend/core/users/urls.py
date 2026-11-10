from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserListView.as_view(), name='user-list'),
    path('<int:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('<int:user_id>/toggle-active/', views.toggle_user_active, name='user-toggle-active'),
]
