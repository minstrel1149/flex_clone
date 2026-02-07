import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

def create_figure_and_df(data_bundle, dimension_ui_name, drilldown_selection, dimension_config, order_map):
    """
    제안 0: 기본 인원 변동 현황 그래프 및 요약 테이블을 생성합니다.
    이 함수는 월/분기/연간 현황 데이터를 딕셔너리 형태로 반환합니다.
    """
    
    # 1. 데이터 및 설정 가져오기
    config = dimension_config.get(dimension_ui_name, {})
    dimension_col = config.get('top', config.get('col'))
    
    # 이 뷰가 사용할 데이터 소스
    dimension_data = data_bundle.get(dimension_ui_name, data_bundle.get('전체', {}))
    overall_data = data_bundle.get('전체', {})

    def _get_tab_content(period_agg_name, period_source_col, tail_n):
        summary_df = dimension_data.get(period_agg_name, pd.DataFrame()).copy()
        overall_summary_df = overall_data.get(period_agg_name, pd.DataFrame()).copy()

        if summary_df.empty or overall_summary_df.empty:
            return None, None

        # 기간(PERIOD) 컬럼 생성
        for df in [summary_df, overall_summary_df]:
            if period_agg_name == 'quarterly':
                df['PERIOD'] = df[period_source_col].apply(lambda q: f"{q.year}년 {q.quarter}분기")
            elif period_agg_name == 'yearly':
                df['PERIOD'] = df[period_source_col].apply(lambda y: f"{y}년")
            else: # monthly
                df['PERIOD'] = df[period_source_col].dt.strftime('%Y년 %m월')
    
        # 그래프용 데이터(plot_df) 최종 선택 (drilldown_selection 사용)
        if drilldown_selection == '전체' or not dimension_col:
            plot_df = overall_summary_df.tail(tail_n)
            title = f"{period_agg_name.replace('ly','별')} 인원 변동 현황"
        else:
            plot_df = summary_df[summary_df[dimension_col] == drilldown_selection].tail(tail_n)
            title = f"[{drilldown_selection}] {period_agg_name.replace('ly','별')} 인원 변동 현황"

        # 그래프 생성
        if plot_df.empty:
            fig = go.Figure().update_layout(title_text=f"'{drilldown_selection}'에 대한 데이터가 없습니다.")
        else:
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(go.Bar(x=plot_df['PERIOD'], y=plot_df['NEW_HIRES'], name='입사자', marker_color='blue'), secondary_y=False)
            fig.add_trace(go.Bar(x=plot_df['PERIOD'], y=plot_df['LEAVERS'], name='퇴사자', marker_color='red'), secondary_y=False)
            fig.add_trace(go.Scatter(x=plot_df['PERIOD'], y=plot_df['HEADCOUNT'], name='총원', mode='lines+markers+text', text=plot_df['HEADCOUNT'], textposition='top center', line=dict(color='black')), secondary_y=True)
            
            max_val = max(plot_df['NEW_HIRES'].max(), plot_df['LEAVERS'].max())
            y1_range = [0, max_val * 1.5 if max_val > 0 else 10]
            
            fig.update_layout(
                template='plotly', title_text=title, xaxis_title='기간', font_size=14, height=600, barmode='group',
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )
            fig.update_yaxes(title_text="입사/퇴사자 수", secondary_y=False, range=y1_range)
            fig.update_yaxes(title_text="총원", secondary_y=True, rangemode='tozero')
    
        # 요약 테이블(aggregate_df) 생성
        aggregate_df = pd.DataFrame()
        if not summary_df.empty and not overall_summary_df.empty and dimension_col:
            agg_by_dim = summary_df.pivot_table(index='PERIOD', columns=dimension_col, values='HEADCOUNT', aggfunc='last')
            agg_overall = overall_summary_df.pivot_table(index='PERIOD', values='HEADCOUNT', aggfunc='last').rename(columns={'HEADCOUNT': '전체'})
            
            aggregate_df = pd.concat([agg_overall, agg_by_dim], axis=1).fillna(0).astype(int)
            
            # 컬럼 순서 재정렬 (order_map 사용)
            ordered_categories = order_map.get(dimension_col, sorted(summary_df[dimension_col].unique()))
            cols_ordered = ['전체'] + [col for col in ordered_categories if col in aggregate_df.columns]
            
            final_cols = [col for col in cols_ordered if col in aggregate_df.columns]
            aggregate_df = aggregate_df[final_cols]
            
            # [수정] 인덱스(기간)를 컬럼으로 포함시키고, 행 이름을 '구분'으로 설정
            aggregate_df = aggregate_df.tail(tail_n).T.reset_index().rename(columns={'index': '구분'})

        return fig, aggregate_df

    # 각 탭의 데이터 생성
    m_fig, m_df = _get_tab_content('monthly', 'PERIOD_DT', 12)
    q_fig, q_df = _get_tab_content('quarterly', 'QUARTER', 12)
    y_fig, y_df = _get_tab_content('yearly', 'YEAR', 10)

    # 결과를 탭 구조로 묶어서 반환
    return {
        "type": "tabs",
        "tabs": [
            {
                "label": "월별 현황", 
                "fig": m_fig, 
                "df": m_df
            },
            {
                "label": "분기별 현황", 
                "fig": q_fig, 
                "df": q_df
            },
            {
                "label": "연간 현황", 
                "fig": y_fig, 
                "df": y_df
            }
        ]
    }
